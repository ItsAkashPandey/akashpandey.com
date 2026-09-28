import { chatAttempts, openChatStream, UpstreamError } from "@/lib/chat-providers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEYS = [
  "CEREBRAS_API_KEY",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "OPENROUTER_FALLBACK_MODELS",
  "CEREBRAS_MODEL",
  "KASI_PROVIDERS",
];

function sse(...pieces: string[]) {
  const body = pieces
    .map((text) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`)
    .join("");
  return new Response(`${body}data: [DONE]\n\n`, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function readAll(stream: Awaited<ReturnType<typeof openChatStream>>) {
  let text = stream.first;
  for await (const piece of stream.rest) text += piece;
  return text;
}

const messages = [{ role: "user", content: "hi" }];

beforeEach(() => {
  for (const key of KEYS) vi.stubEnv(key, "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("chatAttempts", () => {
  it("only uses providers that have a key, fastest first", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "or-key");
    vi.stubEnv("CEREBRAS_API_KEY", "cb-key");
    const attempts = chatAttempts();
    expect(attempts.map((a) => `${a.provider.id}:${a.models[0]}`)).toEqual([
      "cerebras:qwen-3.8-27b",
      "cerebras:gpt-oss-120b",
      "openrouter:google/gemma-4-31b-it:free",
    ]);
    // OpenRouter falls back on its side and always ends with the free router.
    expect(attempts.at(-1)?.models.at(-1)).toBe("openrouter/free");
  });

  it("follows KASI_PROVIDERS and the model overrides", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "or-key");
    vi.stubEnv("CEREBRAS_API_KEY", "cb-key");
    vi.stubEnv("KASI_PROVIDERS", "openrouter,cerebras");
    vi.stubEnv("OPENROUTER_MODEL", "example/paid-model");
    vi.stubEnv("CEREBRAS_MODEL", "gpt-oss-120b");
    const attempts = chatAttempts();
    expect(attempts[0].models).toEqual(["example/paid-model", "openrouter/free"]);
    expect(attempts[1].models).toEqual(["gpt-oss-120b"]);
  });

  it("is empty with no keys", () => {
    expect(chatAttempts()).toEqual([]);
  });
});

describe("openChatStream", () => {
  it("moves on when a provider is rate limited", async () => {
    vi.stubEnv("CEREBRAS_API_KEY", "cb-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(sse("Akash ", "flies drones."));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const stream = await openChatStream(messages, Date.now() + 30_000);
    expect(await readAll(stream)).toBe("Akash flies drones.");
    expect(stream.model()).toBe("cerebras:gpt-oss-120b");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe("gpt-oss-120b");
  });

  it("reports a rate limit when every provider is rate limited", async () => {
    vi.stubEnv("CEREBRAS_API_KEY", "cb-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => new Response("", { status: 429 })),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(openChatStream(messages, Date.now() + 30_000)).rejects.toMatchObject({
      kind: "rateLimit",
    });
  });

  it("fails with a config error when no key is set", async () => {
    await expect(openChatStream(messages, Date.now() + 30_000)).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });

  it("drops reasoning a model writes into the answer", async () => {
    vi.stubEnv("GROQ_API_KEY", "gq-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(sse("<thi", "nk>let me see</think>", "\n\nHello", " there")),
    );
    const stream = await openChatStream(messages, Date.now() + 30_000);
    expect(await readAll(stream)).toBe("Hello there");
  });

  it("leaves ordinary answers alone", async () => {
    vi.stubEnv("GROQ_API_KEY", "gq-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse("<b>", "Bold</b> move")));
    const stream = await openChatStream(messages, Date.now() + 30_000);
    expect(await readAll(stream)).toBe("<b>Bold</b> move");
  });
});
