export const runtime = "nodejs";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appendChatLogRows, type ChatLogAppendResult, type ChatLogRow } from "@/lib/chat-log";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type NameInferenceResult = {
  visitorName: string | null;
};

function safeParseNameInference(text: string): NameInferenceResult | null {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<NameInferenceResult>;
    if (parsed && typeof parsed === "object") {
      const name =
        typeof parsed.visitorName === "string"
          ? parsed.visitorName.trim().slice(0, 80)
          : null;
      return { visitorName: name || null };
    }
    return null;
  } catch {
    return null;
  }
}

async function inferVisitorNameFromUserText(opts: {
  apiKey: string;
  model: string;
  userText: string;
}): Promise<string | null> {
  const text = opts.userText.trim();
  if (!text) return null;

  // Keep this extremely small/cheap and deterministic.
  const prompt =
    "You extract a user's preferred name from text. " +
    "Return STRICT JSON only (no markdown, no prose) like: {\"visitorName\":\"Akash\"} or {\"visitorName\":null}. " +
    "Input may contain a single user message, or a short exchange like 'User: ...\\nAssistant: ...'. " +
    "CRITICAL: Only return a name if the USER is telling you their name or explicitly instructing what they want to be called. " +
    "If the user is asking the assistant's name (e.g. 'what is your name?'), return null. " +
    "If a name appears only in the Assistant text (like 'I'm kasi'), ignore it and return null. " +
    "IMPORTANT: If the user's response is a deflection, dismissal, or indicates they want to skip naming " +
    "(e.g., 'Leave it', 'Forget it', 'Skip', 'Never mind', 'Nothing', 'Don't worry', 'It's fine', 'Just chat', " +
    "'No thanks', 'Pass', 'Whatever', 'Doesn't matter', 'no one','Not important', 'Let's skip that', 'Move on', etc.), return null. " +
    "Only return a name if it genuinely sounds like a person's name (proper nouns, common first/last names like Rahul, Alex, Priya). " +
    "Rules: If the message is a question/complaint/statement and contains no clear preferred name, return null. " +
    "If the message is just a likely person's name (e.g. 'Rahul', 'Siri', 'Akash Sharma'), return it. " +
    "If the message contains a name plus a question (e.g. 'I'm Siri, what's Akash's age?'), return the name (Siri). " +
    "If the user refuses naming (e.g. 'don't call me anything', 'anonymous'), return null. " +
    "Prefer null over guessing.";

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
          model: opts.model,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: text },
          ],
          temperature: 0,
          max_tokens: 64,
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = (result.choices?.[0]?.message?.content || "").trim();
    const parsed = safeParseNameInference(raw);
    return parsed?.visitorName ?? null;
  } catch (error) {
    console.error("[Name Inference Error]", error);
    return null;
  }
}

function safeLastUserMessage(messages: IncomingMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") {
      const text = (message.content || "").trim();
      return text || null;
    }
  }
  return null;
}

let cachedProfileContext: string | null = null;

async function getProfileContext() {
  const profilePath = path.join(process.cwd(), "src", "data", "profile.md");

  // In dev, the profile changes frequently. Avoid serving stale cached context.
  if (process.env.NODE_ENV !== "production") {
    return await readFile(profilePath, "utf-8");
  }

  if (cachedProfileContext) {
    return cachedProfileContext;
  }

  cachedProfileContext = await readFile(profilePath, "utf-8");
  return cachedProfileContext;
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      conversationId,
      visitorName,
    }: {
      messages: IncomingMessage[];
      conversationId?: string;
      visitorName?: string;
    } = await req.json();

    const visitorCookieName = "hal_vid";
    const cookieStore = await cookies();
    const existingVisitorId = cookieStore.get(visitorCookieName)?.value;
    const visitorId = existingVisitorId || crypto.randomUUID();

    const resolvedConversationId =
      typeof conversationId === "string" && conversationId.trim()
        ? conversationId.trim()
        : crypto.randomUUID();

    const resolvedVisitorName =
      typeof visitorName === "string" && visitorName.trim()
        ? visitorName.trim().slice(0, 80)
        : null;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openrouter/free";

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }

    const profileContext = await getProfileContext();
    const systemPrompt =
      `You are kasi, the website assistant for Akash.\n` +
      `Use PROFILE CONTEXT as the source of truth for Akash's personal facts (age, height, roles, contact, etc).\n` +
      `Do not guess, approximate, or invent Akash-specific details. If a personal fact is not present in PROFILE CONTEXT, say you don't have that info.\n` +
      `If the user asks about your (kasi's) physical attributes, you have none.\n\n` +
      `PROFILE CONTEXT (authoritative):\n${profileContext}`;
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(messages || []).map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
    ];

    let reply = "Sorry, I don't have an answer for that.";
    try {
      const apiResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://akashpandey.com",
            "X-Title": "kasi - Akash Website Assistant",
          },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            temperature: 0.3,
            max_tokens: 512,
          }),
        },
      );

      if (!apiResponse.ok) {
        throw new Error(`OpenRouter API error: ${apiResponse.statusText}`);
      }

      const result = (await apiResponse.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      reply =
        (result.choices?.[0]?.message?.content || "").trim() || reply;
    } catch (error) {
      console.error("[OpenRouter API Error]", error);
      return new Response(
        JSON.stringify({ error: "Failed to communicate with OpenRouter API" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Best-effort: infer a preferred name from the latest user message if none was provided.
    // Only attempt inference on the first 3 user messages to save API quota.
    // If the visitor hasn't shared their name by then, they likely don't want to.
    let inferredVisitorName: string | null = null;
    const userMessageCount = (messages || []).filter((m) => m.role === "user").length;
    if (!resolvedVisitorName && userMessageCount <= 3) {
      try {
        const lastUserText = safeLastUserMessage(messages || []);
        if (lastUserText) {
          inferredVisitorName = await inferVisitorNameFromUserText({
            apiKey,
            model,
            userText: `User: ${lastUserText}\nAssistant: ${reply}`,
          });
        }
      } catch (e) {
        console.warn("[Visitor Name Inference Warning]", e);
      }
    }

    // Log user+assistant turns (best-effort, never fail the chat on logging issues).
    let logResult: ChatLogAppendResult | null = null;
    try {
      const lastUserText = safeLastUserMessage(messages || []);
      const timestamp = new Date().toISOString();
      const rows: ChatLogRow[] = [];

      if (lastUserText) {
        rows.push({
          timestamp,
          visitorId,
          visitorName: resolvedVisitorName ?? inferredVisitorName,
          conversationId: resolvedConversationId,
          role: "user",
          message: lastUserText,
        });
      }

      rows.push({
        timestamp,
        visitorId,
        visitorName: resolvedVisitorName ?? inferredVisitorName,
        conversationId: resolvedConversationId,
        role: "assistant",
        message: reply,
      });

      if (rows.length > 0) {
        logResult = await appendChatLogRows(rows);
      }
    } catch (logError) {
      console.warn("[Chat Log Warning]", logError);
      logResult = {
        status: "error",
        error: logError instanceof Error ? logError.message : "Unknown log error",
      };
    }

    if (logResult?.status === "disabled") {
      console.warn(`[Chat Log Disabled] ${logResult.reason}`);
    }

    if (logResult?.status === "error") {
      console.warn(`[Chat Log Failed] ${logResult.error}`);
    }

    const includeDebug = process.env.NODE_ENV !== "production";
    const res = NextResponse.json({
      reply,
      visitorName: resolvedVisitorName ?? inferredVisitorName,
      ...(includeDebug
        ? {
          meta: {
            chatLog: logResult ?? { status: "disabled", reason: "No rows" },
          },
        }
        : {}),
    });
    if (!existingVisitorId) {
      res.cookies.set(visitorCookieName, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
    return res;
  } catch (error) {
    console.error("[API Chat Route Error]", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Internal Server Error", detail: errorMessage },
      { status: 500 },
    );
  }
}
