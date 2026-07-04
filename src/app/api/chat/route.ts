export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  appendChatLogRows,
  type ChatLogAppendResult,
  type ChatLogRow,
} from "@/lib/chat-log";
import type {
  ChatAction,
  ChatHistoryMessage,
  ChatUiCard,
} from "@/lib/chat-types";
import {
  buildKnowledgePrompt,
  retrieveSiteKnowledge,
  type KnowledgeDoc,
} from "@/lib/site-knowledge";

type ChatRequestBody = {
  message?: unknown;
  history?: unknown;
  messages?: unknown;
  conversationId?: string;
  visitorName?: string;
  client?: {
    page?: string;
  };
};

const FRIENDLY_ERRORS = {
  busy: "Kasi is busy for a moment. Try again in a few seconds.",
  rateLimit:
    "Too many chat requests at once. Give it a few seconds and try again.",
  config:
    "Kasi is not configured right now. Akash needs to check the model key.",
  generic: "Something went sideways. Please try again.",
};

const FREE_FALLBACK_MODELS = [
  "openrouter/free",
  "minimax/minimax-m2.5:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "liquid/lfm-2.5-1.2b-thinking:free",
];

const MAX_HISTORY = 10;
const MAX_MESSAGE_LENGTH = 2400;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string, limit = 24, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

function normalizeOneMessage(message: unknown): ChatHistoryMessage | null {
  if (!message || typeof message !== "object") return null;
  const candidate = message as { role?: unknown; content?: unknown };
  if (candidate.role !== "user" && candidate.role !== "assistant") return null;
  if (typeof candidate.content !== "string") return null;

  const content = candidate.content.trim();
  if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
  return { role: candidate.role, content };
}

function normalizeHistory(input: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(normalizeOneMessage)
    .filter(Boolean)
    .slice(-MAX_HISTORY) as ChatHistoryMessage[];
}

function resolveMessageAndHistory(body: ChatRequestBody): {
  message: string | null;
  history: ChatHistoryMessage[];
} {
  if (typeof body.message === "string") {
    const message = body.message.trim();
    return {
      message: message && message.length <= MAX_MESSAGE_LENGTH ? message : null,
      history: normalizeHistory(body.history),
    };
  }

  const legacyMessages = normalizeHistory(body.messages);
  const lastUserIndex = [...legacyMessages]
    .reverse()
    .findIndex((message) => message.role === "user");
  if (lastUserIndex < 0) {
    return { message: null, history: legacyMessages };
  }

  const actualIndex = legacyMessages.length - 1 - lastUserIndex;
  const current = legacyMessages[actualIndex];
  return {
    message: current.content,
    history: legacyMessages.slice(0, actualIndex).slice(-MAX_HISTORY),
  };
}

function inferVisitorNameFast(text: string): string | null {
  const trimmed = text.trim();
  const direct = trimmed.match(
    /(?:my name is|i am|i'm|call me|this is)\s+([a-z][a-z .'-]{1,50})/i,
  );
  const rawName =
    direct?.[1] ||
    (/^[a-z][a-z .'-]{1,40}$/i.test(trimmed) && trimmed.split(/\s+/).length <= 3
      ? trimmed
      : "");
  const name = rawName
    .replace(/[?!.]+$/g, "")
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
    .trim();

  if (!name) return null;
  if (
    /^(skip|nothing|anonymous|no|none|forget|leave|whatever|hello|hi|hey)$/i.test(
      name,
    )
  ) {
    return null;
  }

  return name.slice(0, 80);
}

function inferIntent(text: string) {
  const lower = text.toLowerCase();
  if (/(contact|email|reach|connect|message)/.test(lower)) return "contact";
  if (/(publication|paper|journal|doi|research|poster)/.test(lower)) {
    return "publications";
  }
  if (/(activity|event|conference|workshop|visit|timeline)/.test(lower)) {
    return "activities";
  }
  if (
    /(skill|tool|uav|gps|software|instrument|drone|gis|sensor|spectro|phenocam|weather station|theodolite|total station|faro|trimble|emlid|sokkia|python|qgis|arcgis|earth engine|pix4d|cloudcompare|latex|erdas|envi|revit|staad|autocad)/.test(
      lower,
    )
  ) {
    return "skills";
  }
  if (/(phd|education|degree|iit|mtech|btech)/.test(lower)) return "education";
  if (/(role|job|career|experience|bhoomicam|work)/.test(lower)) {
    return "career";
  }
  return "general";
}

function isCodeRequest(text: string) {
  const lower = text.toLowerCase();
  return (
    /```|<script|<\/?[a-z][^>]*>|(?:code|coding|program|script|function|component|api|sql|regex|algorithm)/i.test(
      text,
    ) ||
    /(?:write|generate|give|show|build|create|implement|debug|fix|refactor|explain)\s+(?:me\s+)?(?:a\s+|the\s+)?(?:python|javascript|typescript|react|next\.?js|java|c\+\+|c#|html|css|code)/i.test(
      lower,
    )
  );
}

function getCodeRequestAttempt(message: string, history: ChatHistoryMessage[]) {
  if (!isCodeRequest(message)) return 0;
  const previousRequests = history.filter(
    (item) => item.role === "user" && isCodeRequest(item.content),
  ).length;
  return previousRequests + 1;
}

function buildSystemPrompt(opts: {
  knowledgePrompt: string;
  actions: ChatAction[];
  codeRequestAttempt: number;
}) {
  const actionLines = opts.actions
    .filter((action) => action.href)
    .map((action) => `- ${action.label}: ${action.href}`)
    .join("\n");

  return [
    "You are kasi, the website assistant for Akash Pandey / Akash Kumar.",
    "Be concise, warm, and useful. Answer Akash-specific questions only from the supplied context.",
    "If a fact about Akash is not in context, say you do not have that exact detail.",
    "For non-Akash questions, answer briefly when appropriate, then connect back to the website if useful.",
    "Use Markdown. Use a compact table only when it improves scanning.",
    "Use only the context relevant to the current question. Never append unrelated activities, publications, skills, or navigation suggestions.",
    "When a useful page exists, write a descriptive clickable Markdown link such as [skills page](/skills), never a bare path such as /skills.",
    "When inviting the visitor to ask Akash directly, link both [the contact form](/contact) and [akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in).",
    "For a named instrument or software tool, include the exact model and concrete tasks from context when they are available.",
    "For a named tool question, close with a brief invitation to use [the contact form](/contact) or email [akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in) for deployment-specific details.",
    "Never claim you can see private files or admin logs.",
    "Adapt to the visitor's register and energy: concise to concise, playful to playful, romantic to warmly romantic, and blunt to direct.",
    "Do not escalate harassment, demeaning language, hate, threats, or sexually explicit content. Keep tone-matching clever and bounded.",
    "If this is code request attempt 1 or 2, provide a genuinely useful answer and working code when the request is safe.",
    `Code request attempt in this conversation: ${opts.codeRequestAttempt || "none"}.`,
    "",
    "Relevant website context:",
    opts.knowledgePrompt,
    "",
    "Useful links you may mention:",
    actionLines || "- /contact",
  ].join("\n");
}

function removeRepeatedReply(input: string) {
  const text = input.trim();
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length >= 2 && paragraphs.length % 2 === 0) {
    const midpoint = paragraphs.length / 2;
    const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
    const secondHalf = paragraphs.slice(midpoint).join("\n\n");
    if (firstHalf === secondHalf) return firstHalf;
  }

  const normalizedLength = text.length;
  for (
    let split = Math.floor(normalizedLength * 0.45);
    split <= Math.ceil(normalizedLength * 0.55);
    split += 1
  ) {
    const first = text.slice(0, split).trim();
    const second = text.slice(split).trim();
    if (first.length > 80 && first === second) return first;
  }

  return text;
}

function directToolReply(message: string, docs: KnowledgeDoc[]) {
  const normalizedMessage = message.toLowerCase();
  const tool = docs.find((doc) => {
    if (!doc.id.startsWith("skill-tool-")) return false;
    const identifyingTerms = [
      doc.title,
      doc.details?.model ?? "",
      ...(doc.keywords ?? []),
    ]
      .flatMap((value) => value.toLowerCase().split(/[^a-z0-9+.-]+/))
      .filter(
        (term) =>
          term.length >= 4 &&
          !["skill", "tool", "instrument", "software"].includes(term),
      );
    return identifyingTerms.some((term) => normalizedMessage.includes(term));
  });

  if (!tool) return null;

  const model =
    tool.details?.model && tool.details.model !== tool.title
      ? ` (${tool.details.model})`
      : "";
  const tasks = (tool.details?.tasks ?? [])
    .map((task) => `- ${task.charAt(0).toUpperCase()}${task.slice(1)}`)
    .join("\n");
  const experience = (tool.details?.experience ?? tool.text)
    .replace(/^I have\b/i, "He has")
    .replace(/^I use\b/i, "He uses")
    .replace(/^I work\b/i, "He works")
    .replace(/^My\b/i, "His")
    .replace(/\bmy\b/gi, "his");

  return [
    `Akash has hands-on experience with **${tool.title}${model}**.`,
    experience,
    tasks ? `\nHe has used it for:\n${tasks}` : "",
    tool.href ? `\n[See it on the skills page](${tool.href}).` : "",
    "\nFor campaign- or setup-specific details, use [the contact form](/contact) or email [akash_k@ce.iitr.ac.in](mailto:akash_k@ce.iitr.ac.in).",
  ]
    .filter(Boolean)
    .join("\n");
}

async function askOpenRouter(opts: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: ChatHistoryMessage[];
  message: string;
}): Promise<{ reply: string; modelUsed: string }> {
  const modelsToTry = [
    opts.model,
    ...FREE_FALLBACK_MODELS.filter((model) => model !== opts.model),
  ];

  let lastError: string | null = null;
  const messages = [
    { role: "system" as const, content: opts.systemPrompt },
    ...opts.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: opts.message },
  ];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${opts.apiKey}`,
            "HTTP-Referer": "https://akashpandey.com",
            "X-Title": "kasi - Akash Website Assistant",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.25,
            max_tokens: 1000,
          }),
        },
      );

      if (response.status === 429) {
        lastError = "rate-limited";
        continue;
      }

      if (!response.ok) {
        lastError = String(response.status);
        continue;
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = result.choices?.[0]?.message?.content?.trim();
      if (reply) return { reply, modelUsed: model };
    } catch {
      lastError = "exception";
    }
  }

  throw new Error(lastError || "model-failed");
}

function buildNotes(input: Record<string, unknown>) {
  return JSON.stringify(input);
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const rateLimitKey = getClientIp(req);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: FRIENDLY_ERRORS.rateLimit },
        { status: 429 },
      );
    }

    const body = (await req.json()) as ChatRequestBody;
    const { message, history } = resolveMessageAndHistory(body);

    if (!message) {
      return NextResponse.json(
        { error: "Please send a shorter, valid chat message." },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const visitorCookieName = "hal_vid";
    const existingVisitorId = cookieStore.get(visitorCookieName)?.value;
    const visitorId = existingVisitorId || crypto.randomUUID();
    const conversationId =
      typeof body.conversationId === "string" && body.conversationId.trim()
        ? body.conversationId.trim()
        : crypto.randomUUID();
    const visitorName =
      typeof body.visitorName === "string" && body.visitorName.trim()
        ? body.visitorName.trim().slice(0, 80)
        : inferVisitorNameFast(message);

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    if (!apiKey) {
      return NextResponse.json(
        { error: FRIENDLY_ERRORS.config },
        { status: 503 },
      );
    }

    const retrieval = retrieveSiteKnowledge(message);
    const intent = inferIntent(message);
    const systemPrompt = buildSystemPrompt({
      knowledgePrompt: buildKnowledgePrompt(retrieval.docs),
      actions: retrieval.actions,
      codeRequestAttempt: getCodeRequestAttempt(message, history),
    });

    const codeRequestAttempt = getCodeRequestAttempt(message, history);
    const toolReply =
      intent === "skills" ? directToolReply(message, retrieval.docs) : null;
    let reply: string;
    let modelUsed: string;

    if (codeRequestAttempt >= 3) {
      reply =
        "I’m going to stop the coding detour here. Kasi is Akash’s portfolio guide, not a general coding workspace. I can still help you explore Akash’s research, activities, publications, skills, or contact details.";
      modelUsed = "local/code-request-boundary";
    } else if (toolReply) {
      reply = toolReply;
      modelUsed = "local/tool-detail";
    } else {
      const modelResponse = await askOpenRouter({
        apiKey,
        model,
        systemPrompt,
        history,
        message,
      });
      modelUsed = modelResponse.modelUsed;

      const warning =
        codeRequestAttempt === 1
          ? "Quick heads-up: I’ll help with this, but Kasi lives on Akash’s portfolio—a coding workspace is a better home for sustained technical work."
          : codeRequestAttempt === 2
            ? "I’ll help once more, but this is the second coding detour. After this, I’ll keep the conversation focused on Akash’s portfolio."
            : "";
      reply = warning
        ? `${warning}\n\n${modelResponse.reply}`
        : modelResponse.reply;
      reply = removeRepeatedReply(reply);
    }

    const latencyMs = Date.now() - startedAt;
    const turnId = crypto.randomUUID();
    let logResult: ChatLogAppendResult | null = null;

    try {
      const timestamp = new Date().toISOString();
      const commonNotes = {
        turnId,
        intent,
        latencyMs,
        model: modelUsed,
        page: body.client?.page || null,
        contextRefs: retrieval.docs.map((doc) => doc.id),
        actions: retrieval.actions.map((action) => ({
          label: action.label,
          href: action.href ?? null,
          prompt: action.prompt ?? null,
        })),
      };

      const rows: ChatLogRow[] = [
        {
          timestamp,
          visitorId,
          visitorName,
          conversationId,
          role: "user",
          message,
          notes: buildNotes({ ...commonNotes, sequence: 1 }),
        },
        {
          timestamp,
          visitorId,
          visitorName,
          conversationId,
          role: "assistant",
          message: reply,
          notes: buildNotes({ ...commonNotes, sequence: 2 }),
        },
      ];

      logResult = await appendChatLogRows(rows);
    } catch (logError) {
      console.warn("[Chat Log Warning]", logError);
      logResult = {
        status: "error",
        error:
          logError instanceof Error ? logError.message : "Unknown log error",
      };
    }

    if (logResult?.status === "disabled") {
      console.warn(`[Chat Log Disabled] ${logResult.reason}`);
    }
    if (logResult?.status === "error") {
      console.warn(`[Chat Log Failed] ${logResult.error}`);
    }

    const response = NextResponse.json({
      reply,
      visitorName,
      actions: retrieval.actions,
      cards: retrieval.cards,
      ...(process.env.NODE_ENV !== "production"
        ? {
            meta: {
              intent,
              latencyMs,
              model: modelUsed,
              contextRefs: retrieval.docs.map((doc) => doc.id),
              chatLog: logResult,
            },
          }
        : {}),
    });

    if (!existingVisitorId) {
      response.cookies.set(visitorCookieName, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error("[API Chat Route Error]", error);
    const message =
      error instanceof Error && error.message === "rate-limited"
        ? FRIENDLY_ERRORS.rateLimit
        : FRIENDLY_ERRORS.busy || FRIENDLY_ERRORS.generic;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
