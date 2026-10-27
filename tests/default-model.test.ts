// The engine's own model: one OpenAI-compatible model (LLM_BASE_URL, LLM_API_KEY, LLM_MODEL) runs every
// step of the analysis when nothing picks another one for a step.
import { stub, tag } from "./setup.ts";
import { analysisStep, SELECTING_SCORE, type AnalysisStep } from "./analysis-steps.ts";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { analyzeArticle } from "@aihot/backend/editorial/analyze";
import { CAPABILITIES, type Capability } from "@aihot/backend/editorial/models";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { chatJson } from "@aihot/backend/providers/llm";
import { z } from "zod";

// Nothing chosen per step: every capability falls back to the `default` model (a step the site
// gives a model of its own is sent back to it by its environment variable).
for (const c of Object.values(CAPABILITIES) as Capability[]) {
  if (c.default === "default") delete process.env[c.env];
  else process.env[c.env] = "default";
}

const T = tag();
const SOURCE = `test-default-model-${T}`;
const seen: Array<{ model: string; step: AnalysisStep }> = [];
const requests: Array<{ url: string; body: Record<string, unknown>; headers: Record<string, string | string[] | undefined> }> = [];
const provider = await stub((_hit, req) => {
  const body = JSON.parse(req.body) as Record<string, unknown>;
  requests.push({ url: req.url, body, headers: req.headers });
  if (req.url === "/v1/messages") {
    const user = JSON.stringify(body.messages);
    return {
      id: `anthropic-${requests.length}`, type: "message",
      content: [{ type: "text", text: user.includes("truncated") ? "{" : JSON.stringify({ value: "anthropic" }) }],
      stop_reason: user.includes("truncated") ? "max_tokens" : "end_turn",
      usage: { input_tokens: 2, output_tokens: 1 },
    };
  }
  if (req.body.includes("named preset stays OpenAI")) {
    return { id: `openai-${requests.length}`, choices: [{ message: { content: JSON.stringify({ value: "openai" }) }, finish_reason: "stop" }] };
  }
  const step = analysisStep(req.body);
  seen.push({ model: body.model as string, step });
  const content =
    step === "prefilter" ? { label: "PASS", reason: "测试" }
    : step === "score" ? { attentionScore: SELECTING_SCORE }
    : step === "understand" ? { itemType: "subsystem_change", authorRole: "principal", tags: ["子系统变更"], editorialJudgment: "理由", titleZh: "一个模型的标题", summaryZh: "一个模型写的摘要。第二句。" }
    : step === "structure" ? { category: "subsystem", tags: ["子系统变更"], subjects: [], fact: null }
    : "title_zh: 标题\nsummary_zh: 摘要。";
  return { id: `stub-${seen.length}`, choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
});
Object.assign(process.env, {
  LLM_BASE_URL: `${provider.url}/v1`, LLM_API_KEY: "test-key", LLM_MODEL: "one-model", MODEL_CALLS_ENABLED: "true",
  LLM_API_STYLE: "openai", LLM_CHAT_PATH: "/chat/completions",
});

before(async () => {
  await sql`INSERT INTO sources (id, name, kind, tier, participation_mode, next_fetch_at) VALUES (${SOURCE}, 'Test default model', 'rss', 'T1', 'editorial', '2100-01-01')`;
});
after(async () => {
  await provider.close();
  await stopBoss();
  await closeDb();
});

test("one model runs the prefilter, both scores, the writing and the structure", async () => {
  const { articleId } = await upsertMaterial({
    sourceId: SOURCE, url: `https://example.com/${T}`, title: `A kernel subsystem change ${T}`, bodyText: `A maintainer proposed a Linux kernel subsystem change with compatibility details. ${T} `.repeat(6),
    bodyStatus: "ok", via: "fetch", publishedAt: new Date(),
  } as never);
  const res = await analyzeArticle(articleId);
  assert.equal(res!.output!.selected, true);
  assert.equal(res!.output!.titleZh, "一个模型的标题");
  assert.deepEqual(seen.map((r) => r.step).sort(), ["prefilter", "score", "score", "structure", "understand"]);
  assert.ok(seen.every((r) => r.model === "one-model"), "every request names the configured model");
  const services = await sql<{ service: string }[]>`SELECT DISTINCT service FROM receipts WHERE subject LIKE ${`article:${articleId}%`}`;
  assert.deepEqual(services.map((s) => s.service), ["llm"]);
});

test("the default model supports Anthropic Messages without changing named OpenAI presets", async () => {
  Object.assign(process.env, {
    LLM_BASE_URL: provider.url,
    LLM_API_STYLE: "anthropic",
    LLM_CHAT_PATH: "/v1/messages",
    DEEPSEEK_BASE_URL: `${provider.url}/v1`,
    DEEPSEEK_API_KEY: "test-key",
  });
  try {
    const result = await chatJson({
      model: "default", purpose: "invariant_test", subject: `anthropic:${T}`, promptVersion: "anthropic-v1", attemptTag: T,
      system: "Return the requested JSON.",
      user: [{ type: "text", text: "provider adapter" }, { type: "image_url", image_url: { url: "data:image/png;base64,YWJj" } }],
      schema: z.object({ value: z.string() }),
    });
    assert.equal(result.data.value, "anthropic");
    const anthropic = requests.at(-1)!;
    assert.equal(anthropic.url, "/v1/messages");
    assert.equal(anthropic.headers["x-api-key"], "test-key");
    assert.equal(anthropic.headers["anthropic-version"], "2023-06-01");
    assert.equal(anthropic.body.system, "Return the requested JSON.");
    assert.equal("response_format" in anthropic.body, false);
    assert.deepEqual(anthropic.body.messages, [{ role: "user", content: [
      { type: "text", text: "provider adapter" },
      { type: "image", source: { type: "base64", media_type: "image/png", data: "YWJj" } },
    ] }]);

    await assert.rejects(chatJson({
      model: "default", purpose: "invariant_test", subject: `anthropic-truncated:${T}`, promptVersion: "anthropic-v1", attemptTag: T,
      system: "", user: "truncated", schema: z.object({ value: z.string() }),
    }), /finish_reason=length/);

    const named = await chatJson({
      model: "deepseek-flash", purpose: "invariant_test", subject: `openai-preset:${T}`, promptVersion: "openai-v1", attemptTag: T,
      system: "", user: "named preset stays OpenAI", schema: z.object({ value: z.string() }),
    });
    assert.equal(named.data.value, "openai");
    assert.equal(requests.at(-1)!.url, "/v1/chat/completions");
  } finally {
    Object.assign(process.env, { LLM_BASE_URL: `${provider.url}/v1`, LLM_API_STYLE: "openai", LLM_CHAT_PATH: "/chat/completions" });
  }
});
