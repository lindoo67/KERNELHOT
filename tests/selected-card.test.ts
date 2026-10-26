// Failure cases: the card shows no publication date, so a weeks-old launch pushed today reads as
// today's news; the date is taken in UTC and lands a day early around Beijing midnight; the title is no
// larger than the summary, or the source and date read as body text; markdown characters in a model's
// words break the card; the reason reads as body text.
import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { config } from "@aihot/backend/config";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { publishArticle } from "@aihot/backend/publication/publish";
import { selectedContent } from "@aihot/backend/notify/selected-content";
import { CATEGORIES } from "@aihot/industry/taxonomy";
import { ITEM_COPY, SITE } from "@aihot/site";

config.siteUrl = "https://example.org";

const T = tag();
const SOURCE = `card-${T}`;
before(async () => {
  await sql`INSERT INTO sources(id,name,kind,tier,participation_mode,next_fetch_at)
    VALUES (${SOURCE},'kernel.org','rss','T1','editorial','2100-01-01')`;
});
after(async () => { await stopBoss(); await closeDb(); });

const RELEASE = { title: "Linux 6.12 LTS 正式发布", summary: "kernel.org 发布 Linux 6.12，并标注为 LTS 分支。" };

async function selected(category: string, reason: string | null, copy = RELEASE) {
  const { articleId } = await upsertMaterial({ sourceId: SOURCE, url: `https://example.org/${T}/${category}`,
    title: `${T} ${category}`, bodyText: "Body.", bodyStatus: "ok", via: "fetch", publishedAt: new Date() });
  await sql`INSERT INTO analyses(article_id,input_revision,origin,relevance,category,title_zh,summary_zh,reason_zh,score,selected)
    VALUES (${articleId},1,'rule','pass',${category},${copy.title},${copy.summary},${reason},90,true)`;
  await sql`UPDATE articles SET grouping_status='complete',grouped_at=now(),selection_adds_value=true WHERE id=${articleId}`;
  await publishArticle(articleId);
  // 00:30 in Beijing on the 15th is still the 14th in UTC.
  await sql`UPDATE publications SET published_at='2026-10-14T16:30:00Z' WHERE article_id=${articleId}`;
  const content = await selectedContent(articleId);
  assert.equal(content.status, "ready");
  return (content as Extract<typeof content, { status: "ready" }>).card as any;
}
const category = (key: string) => CATEGORIES.find((c) => c.key === key)!;

test("the title is larger than the summary, followed by the source and Beijing date in grey", async () => {
  const card = await selected("release", "公告给出版本身份与 LTS 状态，可据此安排维护分支。");
  assert.equal(card.schema, "2.0");
  assert.equal(card.header, undefined, "a header title cannot be made larger");
  const [title, meta, summary, reason, buttons] = card.body.elements;
  const release = category("release");
  assert.equal(title.content, `**Linux 6.12 LTS 正式发布** <text_tag color='${release.tagColor}'>${release.label}</text_tag>`);
  const size = card.config.style.text_size[title.text_size];
  for (const end of ["default", "pc", "mobile"]) assert.match(size[end], /^heading-[34]$/, "18px on computers, 16px on phones");
  assert.equal(summary.text_size ?? "normal", "normal");
  assert.equal(summary.content, "kernel.org 发布 Linux 6.12，并标注为 LTS 分支。");
  assert.deepEqual([meta.text_size, meta.content], ["notation", "<font color='grey'>kernel.org · 10月15日发布</font>"]);
  assert.deepEqual([reason.text_size, reason.content], ["notation", `<font color='grey'>**${ITEM_COPY.reasonLabel}**　公告给出版本身份与 LTS 状态，可据此安排维护分支。</font>`]);
  const links = buttons.columns.map((c: any) => c.elements[0]);
  assert.deepEqual(links.map((b: any) => b.text.content), [`在 ${SITE.name} 阅读`, "原文"]);
  assert.ok(links.every((b: any) => b.behaviors[0].type === "open_url" && b.behaviors[0].default_url.startsWith("https://")));
  assert.doesNotMatch(JSON.stringify(card), /来源：/);
});

test("without a reason the card goes from the summary straight to the buttons", async () => {
  const card = await selected("security", null, { title: "Linux 内核修复 CVE-2026-1234", summary: "公告列出受影响分支与修复版本，未说明存在在野利用。" });
  assert.deepEqual(card.body.elements.map((e: any) => e.tag), ["markdown", "markdown", "markdown", "column_set"]);
  assert.match(card.body.elements[0].content, new RegExp(`color='${category("security").tagColor}'`));
});

test("markdown characters in the model's words show as written", async () => {
  const card = await selected("release", null, { title: "Linux <6.12 的 *RC* 公告", summary: "保留 [版本范围] 与 `CONFIG_TEST`。" });
  assert.ok(card.body.elements[0].content.startsWith("**Linux &#60;6.12 的 &#42;RC&#42; 公告**"));
  assert.equal(card.body.elements[2].content, "保留 &#91;版本范围&#93; 与 &#96;CONFIG_TEST&#96;。");
});
