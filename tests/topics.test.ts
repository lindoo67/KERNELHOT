// Topic pages: which articles a topic takes, and their counts.
// Written before the code, from the ways it can go wrong:
// - a company topic takes an article about another company that only mentions it (several subjects,
//   its name nowhere in the title), or drops one about it whose title names it in English, in another
//   case, next to Chinese text, or only by a product (it is the article's only subject);
// - a Latin name matches inside another word ("Metadata" is not Meta); a headline naming a company
//   that is not a subject of the article gets in;
// - a technical-direction topic stops taking its tags;
// - withdrawn or not yet released articles appear in a list or a count;
// - an article or story page names a topic its reports do not belong to;
// - a topic without content has no page, or an unknown slug or a page past the end has one.
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { publishArticle } from "@aihot/backend/publication/publish";
import { TOPICS, loadTopicPage, listTopicSummaries, topicsOfStory } from "@aihot/backend/publication/topics";
import { TOPIC_TAGS } from "@aihot/industry/taxonomy";
import { buildApp } from "../apps/api/src/app.ts";

test("the topic directory exposes the subsystem, driver and performance fields from the taxonomy", () => {
  const fields = TOPICS.filter((topic) => topic.group === "field");
  assert.deepEqual(fields.map((topic) => topic.slug), [
    "scheduling", "memory-management", "filesystems", "networking", "bpf", "virtualization", "containers", "realtime-kernel",
    "power-management", "observability", "rust-for-linux", "x86-architecture", "arm-architecture", "risc-v", "gpu", "storage", "drivers", "performance",
  ]);
  const tags = new Set(fields.flatMap((topic) => topic.tags));
  for (const tag of TOPIC_TAGS) assert.ok(tags.has(tag), tag);
  assert.ok(fields.every((topic) => topic.entityId === null));
});

test("the topic directory keeps every distro, community and technical article genre", () => {
  const genres = TOPICS.filter((topic) => topic.group === "genre");
  assert.deepEqual(genres.map((topic) => topic.slug), [
    "security-fixes", "kernel-releases", "subsystem-changes", "driver-updates", "performance-reliability",
    "distro-kernel", "community-governance", "technical-articles",
  ]);
  assert.ok(genres.every((topic) => topic.entityId === null));
});

const T = tag();
const OFFICIAL = `test-topics-official-${T}`;
const MEDIA = `test-topics-media-${T}`;
const app = await buildApp();

before(async () => {
  await sql`INSERT INTO sources (id, name, kind, tier, participation_mode, first_party, next_fetch_at) VALUES
    (${OFFICIAL}, 'Official', 'rss', 'T1', 'editorial', true, '2100-01-01'),
    (${MEDIA}, 'Media', 'rss', 'T2', 'editorial', false, '2100-01-01')`;
});
after(async () => {
  await app.close();
  await stopBoss();
  await closeDb();
});

let n = 0;
interface Report {
  source?: string;
  at: Date;
  title: string;
  originalTitle?: string;
  subjects?: string[];
  tags?: string[];
  score?: number;
  selected?: boolean;
  fact?: number;
  category?: string;
}

/** A published report; `fact` links it to a fact before publishing, as grouping would. */
async function report(r: Report): Promise<string> {
  n += 1;
  const { articleId } = await upsertMaterial({
    sourceId: r.source ?? MEDIA, url: `https://example.com/topics-${T}-${n}`, title: r.originalTitle ?? r.title, bodyText: "body", bodyHtml: "<p>body</p>", bodyStatus: "ok", via: "fetch", publishedAt: r.at,
  });
  await sql`UPDATE articles SET discovered_at = ${r.at}, timeline_at = ${r.at}, grouped_at = now() WHERE id = ${articleId}`;
  const category = r.category ?? "release";
  const categoryTag: Record<string, string> = {
    security: "安全修复", release: "内核发布", subsystem: "子系统变更", driver: "驱动更新", performance: "性能优化",
    distro: "发行版内核", community: "社区治理", article: "技术解读",
  };
  await sql`INSERT INTO analyses (article_id, input_revision, origin, relevance, category, title_zh, summary_zh, score, selected, subjects, tags)
            VALUES (${articleId}, 1, 'rule', 'pass', ${category}, ${r.title}, ${`摘要 ${n}`}, ${r.score ?? 80}, ${r.selected ?? true}, ${r.subjects ?? []}, ${[categoryTag[category]!, ...(r.tags ?? [])]})`;
  if (r.fact) await sql`INSERT INTO fact_articles (fact_id, article_id, role) VALUES (${r.fact}, ${articleId}, 'report')`;
  await publishArticle(articleId, { releasedAt: new Date(r.at.getTime() + 60_000) });
  return articleId;
}

async function story(title: string): Promise<{ id: number; publicId: string }> {
  const publicId = randomUUID();
  const [s] = await sql<{ id: number }[]>`INSERT INTO stories (public_id, title, first_report_at, latest_at) VALUES (${publicId}, ${title}, now(), now()) RETURNING id`;
  return { id: s!.id, publicId };
}

async function fact(storyId: number | null, title: string): Promise<number> {
  const [f] = await sql<{ id: number }[]>`INSERT INTO facts (public_id, story_id, title) VALUES (${`f-${T}-${randomUUID()}`}, ${storyId}, ${title}) RETURNING id`;
  return f!.id;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const ids = (items: Array<{ id: string }>) => items.map((i) => i.id);
const page = async (slug: string, p = 1) => {
  const data = await loadTopicPage(slug, p, new Date());
  assert.ok(data, `${slug} page ${p}`);
  return data;
};
/** Every article of a topic, over all its pages. */
async function members(slug: string): Promise<string[]> {
  const first = await page(slug);
  const out = ids(first.items);
  for (let p = 2; p <= first.pageCount; p++) out.push(...ids((await page(slug, p)).items));
  return out;
}

test("a company topic takes the articles about it, not the ones that only mention it", async () => {
  const about = await report({ at: hoursAgo(30), title: `Intel 更新 Xe 驱动 ${T}`, subjects: ["intel"], category: "driver" });
  const product = await report({ at: hoursAgo(31), title: `Xe 驱动合入修复 ${T}`, subjects: ["intel"], category: "driver" });
  const english = await report({ at: hoursAgo(32), title: `新驱动进入主线 ${T}`, originalTitle: `Intel updates a kernel driver ${T}`, subjects: ["intel", "amd"], category: "driver" });
  const amdNamed = await report({ at: hoursAgo(33), title: `AMD 修复 GPU 驱动回归 ${T}`, subjects: ["amd", "intel", "meta"], category: "driver" });
  const lowerCase = await report({ at: hoursAgo(34), title: `amd 提交电源管理改动 ${T}`, subjects: ["amd", "intel"], category: "subsystem" });
  const pact = await report({ at: hoursAgo(35), title: `多家厂商评审驱动接口 ${T}`, subjects: ["amd", "intel", "google"], category: "driver" });
  const metadata = await report({ at: hoursAgo(36), title: `Metadata 机制更新，AMD 参与 ${T}`, subjects: ["meta", "amd"], category: "subsystem" });
  const adjacent = await report({ at: hoursAgo(37), title: `发布Meta的 BPF 改动 ${T}`, subjects: ["meta", "amd"], category: "subsystem" });
  const headline = await report({ at: hoursAgo(38), title: `Intel 被一篇驱动盘点提到 ${T}`, subjects: ["amd"], category: "article" });
  const gpu = await report({ at: hoursAgo(39), title: `DRM 驱动更新 ${T}`, category: "driver", tags: ["GPU"] });

  const intel = await members("intel");
  for (const id of [about, product, english]) assert.ok(intel.includes(id), "about Intel");
  for (const id of [amdNamed, lowerCase, pact, headline]) assert.ok(!intel.includes(id), "only mentions Intel");
  const amd = await members("amd");
  for (const id of [amdNamed, lowerCase, metadata]) assert.ok(amd.includes(id), "about AMD");
  for (const id of [english, pact]) assert.ok(!amd.includes(id), "only mentions AMD");
  const meta = await members("meta");
  assert.ok(meta.includes(adjacent), "Meta next to Chinese text");
  assert.ok(!meta.includes(metadata), "Metadata is not Meta");
  assert.ok((await members("gpu")).includes(gpu), "a technical direction takes its tag");

  // The article page names the topics it belongs to.
  const topicsOf = async (id: string) => {
    const res = await app.inject({ method: "GET", url: `/api/site/items/${id}` });
    return (JSON.parse(res.body) as { topics: Array<{ slug: string }> }).topics.map((t) => t.slug);
  };
  assert.deepEqual(await topicsOf(about), ["intel", "drivers"]);
  assert.deepEqual(await topicsOf(amdNamed), ["amd", "drivers"]);
  assert.deepEqual(await topicsOf(pact), ["drivers"]);
  assert.deepEqual(await topicsOf(gpu), ["gpu", "drivers"]);
});

test("a story page names the topics of its reports", async () => {
  const launch = await story(`DRM 驱动更新 ${T}`);
  await report({ source: OFFICIAL, at: hoursAgo(26), title: `DRM 驱动更新 ${T}`, category: "driver", tags: ["GPU"], fact: await fact(launch.id, "更新驱动") });
  assert.deepEqual(await topicsOfStory(launch.id), [{ slug: "gpu", name: "GPU 驱动" }, { slug: "drivers", name: "设备驱动" }]);
});

test("withdrawn articles stay out of lists and counts", async () => {
  const kept = await report({ at: hoursAgo(5), title: `Intel 更新内核驱动 ${T}`, subjects: ["intel"], category: "driver" });
  const withdrawn = await report({ at: hoursAgo(4), title: `Intel 撤回驱动公告 ${T}`, subjects: ["intel"], category: "driver" });
  await sql`UPDATE publications SET visibility = 'withdrawn' WHERE article_id = ${withdrawn}`;

  const data = await page("intel");
  assert.deepEqual(ids(data.items), [kept]);
  assert.equal(data.topic.total, 1);
  const summary = (await listTopicSummaries()).topics.find((t) => t.slug === "intel")!;
  assert.equal(summary.latest?.title, `Intel 更新内核驱动 ${T}`, "the index shows the newest public article");
});

test("every topic has a page; unknown topics and pages past the end have none", async () => {
  const empty = await page("rust-for-linux");
  assert.equal(empty.topic.indexable, false, "a topic without content is not indexed");
  assert.deepEqual(empty.items, []);
  assert.equal(await loadTopicPage("not-a-topic", 1, new Date()), null);
  assert.equal(await loadTopicPage("rust-for-linux", 2, new Date()), null);
  const index = await app.inject({ method: "GET", url: "/api/site/topics" });
  const body = JSON.parse(index.body) as { groups: Array<{ key: string }>; topics: Array<{ slug: string }> };
  assert.deepEqual(body.groups.map((g) => g.key), ["company", "field", "genre"]);
  assert.deepEqual(body.topics.map((t) => t.slug).sort(), TOPICS.map((t) => t.slug).sort(), "the index lists every topic");
});
