/**
 * Where Kasi's answers come from. Every provider below speaks the same
 * OpenAI-style streaming API and has a free tier, so the chat keeps working
 * without a paid plan: the first provider with a key answers, and when it is
 * rate limited, down or slow to start, the next one takes over before the
 * visitor sees anything.
 *
 * Order comes from KASI_PROVIDERS (default: cerebras, groq, gemini,
 * openrouter). Each provider's models can be changed with <ID>_MODEL, a
 * comma-separated list tried in order.
 */

export type ChatErrorKind = "rateLimit" | "config" | "timeout" | "busy";

export class UpstreamError extends Error {
  constructor(
    readonly kind: ChatErrorKind,
    detail?: string,
  ) {
    super(detail ?? kind);
  }
}

type ProviderId = "cerebras" | "groq" | "gemini" | "openrouter";

type Provider = {
  id: ProviderId;
  baseUrl: string;
  keys: string[];
  defaultModels: string[];
  /** How long to wait for the first words before moving on. */
  firstTokenMs: number;
  /** OpenRouter takes the whole list and falls back on its side. */
  modelsInOneRequest?: boolean;
  params: (model: string) => Record<string, unknown>;
  headers?: Record<string, string>;
};

/**
 * Free OpenRouter models (checked September 2026; the free list changes
 * every few weeks). openrouter/free picks any free model that is up, so the
 * chat still answers when all of these have been retired.
 */
const OPENROUTER_FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "thinkingmachines/inkling:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

const PROVIDERS: Record<ProviderId, Provider> = {
  // ~1,800 tokens/s on the free tier, 1M tokens a day.
  cerebras: {
    id: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    keys: ["CEREBRAS_API_KEY"],
    defaultModels: ["qwen-3.8-27b", "gpt-oss-120b"],
    firstTokenMs: 8_000,
    params: (model) => ({
      max_completion_tokens: 1100,
      ...(model.startsWith("gpt-oss")
        ? { reasoning_effort: "low", reasoning_format: "hidden" }
        : { reasoning_effort: "none" }),
    }),
  },
  // Very fast too, but the free tier allows about one long prompt a minute.
  groq: {
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    keys: ["GROQ_API_KEY"],
    defaultModels: ["openai/gpt-oss-120b"],
    firstTokenMs: 8_000,
    params: (model) => ({
      max_completion_tokens: 1100,
      ...(model.includes("gpt-oss")
        ? { reasoning_effort: "low", include_reasoning: false }
        : model.includes("qwen")
          ? { reasoning_effort: "none" }
          : {}),
    }),
  },
  gemini: {
    id: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    keys: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    defaultModels: ["gemini-3.8-flash", "gemini-3.5-flash-lite"],
    firstTokenMs: 12_000,
    params: (model) => ({
      max_tokens: 1100,
      // Gemini 3 can't switch thinking off; "minimal" is the closest.
      reasoning_effort: model.startsWith("gemini-2.5") ? "none" : "minimal",
    }),
  },
  openrouter: {
    id: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    keys: ["OPENROUTER_API_KEY"],
    defaultModels: OPENROUTER_FREE_MODELS,
    firstTokenMs: 25_000,
    modelsInOneRequest: true,
    params: () => ({
      max_tokens: 1100,
      // Reasoning models otherwise spend the whole budget thinking.
      reasoning: { effort: "low", exclude: true },
    }),
    headers: {
      "HTTP-Referer": "https://www.akashpandey.com",
      "X-Title": "Kasi, akashpandey.com",
    },
  },
};

const DEFAULT_ORDER: ProviderId[] = ["cerebras", "groq", "gemini", "openrouter"];

function list(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function envName(id: ProviderId, suffix: string) {
  return `${id.toUpperCase()}_${suffix}`;
}

function modelsFor(provider: Provider) {
  if (provider.id === "openrouter") {
    // OPENROUTER_MODEL and OPENROUTER_FALLBACK_MODELS predate the other
    // providers; both still work.
    const chosen = [
      ...list(process.env.OPENROUTER_MODEL),
      ...list(process.env.OPENROUTER_FALLBACK_MODELS),
    ];
    return Array.from(
      new Set([
        ...(chosen.length ? chosen : provider.defaultModels),
        "openrouter/free",
      ]),
    );
  }
  const chosen = list(process.env[envName(provider.id, "MODEL")]);
  return chosen.length ? chosen : provider.defaultModels;
}

type Attempt = {
  provider: Provider;
  apiKey: string;
  models: string[];
};

/** Every provider/model pair to try, in order, for providers with a key. */
export function chatAttempts(): Attempt[] {
  const order = list(process.env.KASI_PROVIDERS).filter(
    (id): id is ProviderId => id in PROVIDERS,
  );
  const attempts: Attempt[] = [];
  for (const id of order.length ? order : DEFAULT_ORDER) {
    const provider = PROVIDERS[id];
    const apiKey = provider.keys
      .map((key) => process.env[key]?.trim())
      .find(Boolean);
    if (!apiKey) continue;
    const models = modelsFor(provider);
    if (provider.modelsInOneRequest) {
      attempts.push({ provider, apiKey, models });
    } else {
      for (const model of models) attempts.push({ provider, apiKey, models: [model] });
    }
  }
  return attempts;
}

/**
 * Any provider key, for code that needs a stable server-side secret.
 * OpenRouter comes first because it was the only key before.
 */
export function anyProviderKey() {
  for (const id of ["openrouter", ...DEFAULT_ORDER] as ProviderId[]) {
    for (const key of PROVIDERS[id].keys) {
      const value = process.env[key]?.trim();
      if (value) return value;
    }
  }
  return undefined;
}

function statusKind(status: number): ChatErrorKind {
  if (status === 429) return "rateLimit";
  if (status === 401 || status === 403) return "config";
  return "busy";
}

/**
 * Some models write their reasoning into the answer between <think> tags
 * even when asked not to. Drops a leading think block from the stream.
 */
async function* withoutThinking(chunks: AsyncGenerator<string>) {
  let head = "";
  let passthrough = false;
  // Whitespace right after a think block is dropped too.
  let skipSpace = false;
  for await (const chunk of chunks) {
    if (passthrough) {
      const text = skipSpace ? chunk.trimStart() : chunk;
      if (!text) continue;
      skipSpace = false;
      yield text;
      continue;
    }
    head += chunk;
    const trimmed = head.trimStart();
    if (!trimmed) continue;
    if (!"<think>".startsWith(trimmed.slice(0, 7))) {
      passthrough = true;
      yield head;
      continue;
    }
    if (trimmed.length < 7) continue;
    const end = trimmed.indexOf("</think>");
    if (end < 0) continue;
    passthrough = true;
    const rest = trimmed.slice(end + "</think>".length).trimStart();
    if (rest) yield rest;
    else skipSpace = true;
  }
  if (!passthrough && head.trim() && !head.trimStart().startsWith("<think>")) {
    yield head;
  }
}

type Stream = {
  chunks: AsyncGenerator<string>;
  model: () => string;
};

function streamAttempt(
  attempt: Attempt,
  messages: { role: string; content: string }[],
  deadline: number,
): Stream {
  const { provider, apiKey, models } = attempt;
  const baseUrl = process.env[envName(provider.id, "BASE_URL")] || provider.baseUrl;
  let modelUsed = `${provider.id}:${models[0]}`;

  async function* chunks() {
    const controller = new AbortController();
    const remaining = Math.max(1_000, deadline - Date.now());
    const firstToken = setTimeout(
      () => controller.abort(),
      Math.min(provider.firstTokenMs, remaining),
    );
    const total = setTimeout(() => controller.abort(), remaining);
    let yielded = false;

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...provider.headers,
        },
        body: JSON.stringify({
          ...(provider.modelsInOneRequest ? { models } : { model: models[0] }),
          messages,
          stream: true,
          temperature: 0.4,
          ...provider.params(models[0]),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => "");
        throw new UpstreamError(
          statusKind(response.status),
          `${response.status} ${detail.slice(0, 200)}`.trim(),
        );
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;

        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") return;

          let event: {
            model?: string;
            error?: { message?: string; code?: number | string };
            choices?: { delta?: { content?: string | null } }[];
          };
          try {
            event = JSON.parse(data);
          } catch {
            continue;
          }
          if (event.error) {
            throw new UpstreamError(
              Number(event.error.code) === 429 ? "rateLimit" : "busy",
              event.error.message,
            );
          }
          if (event.model && provider.modelsInOneRequest) {
            modelUsed = `${provider.id}:${event.model}`;
          }
          const text = event.choices?.[0]?.delta?.content;
          if (text) {
            if (!yielded) clearTimeout(firstToken);
            yielded = true;
            yield text;
          }
        }
      }

      if (!yielded) throw new UpstreamError("busy", "empty answer");
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      throw new UpstreamError(
        controller.signal.aborted ? "timeout" : "busy",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      clearTimeout(firstToken);
      clearTimeout(total);
      // Closes the connection when the answer is abandoned half way.
      controller.abort();
    }
  }

  return { chunks: withoutThinking(chunks()), model: () => modelUsed };
}

export type OpenedStream = {
  first: string;
  rest: AsyncGenerator<string>;
  model: () => string;
};

/**
 * Tries each provider until one starts answering. Resolves with the first
 * piece of text and the rest of the stream; rejects with the most useful
 * error when every provider failed.
 */
export async function openChatStream(
  messages: { role: string; content: string }[],
  deadline: number,
): Promise<OpenedStream> {
  const attempts = chatAttempts();
  if (!attempts.length) throw new UpstreamError("config", "no provider key set");

  const failures: UpstreamError[] = [];
  for (const attempt of attempts) {
    if (Date.now() > deadline - 2_000) break;
    const stream = streamAttempt(attempt, messages, deadline);
    try {
      const first = await stream.chunks.next();
      if (first.done) throw new UpstreamError("busy", "empty answer");
      return { first: first.value, rest: stream.chunks, model: stream.model };
    } catch (error) {
      const failure =
        error instanceof UpstreamError ? error : new UpstreamError("busy", String(error));
      failures.push(failure);
      console.warn(
        `[chat] ${attempt.provider.id}:${attempt.models.join("|")} failed (${failure.kind}): ${failure.message}`,
      );
    }
  }

  // A bad key is only worth reporting when nothing else was even tried.
  const useful = failures.filter((failure) => failure.kind !== "config");
  throw (
    useful.find((failure) => failure.kind !== "rateLimit") ??
    useful[0] ??
    failures[0] ??
    new UpstreamError("timeout")
  );
}
