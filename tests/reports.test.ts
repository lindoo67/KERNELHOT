// Reports: a scheduled run that starts late still writes the issue it was due for, never one whose
// window is still open; a daily whose window nothing was judged in is refused rather than published as a
// quiet day; and an older weekly that froze no summaries shows the cited articles' public summaries.
import { editionAt, tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDb, sql } from "@aihot/backend/db";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { publishArticle } from "@aihot/backend/publication/publish";
import { loadReport } from "@aihot/backend/publication/reports";
import { composeDaily, dueDaily, dueMonthly, dueWeekly } from "@aihot/backend/reports/compose";
import { EDITION_TIMES, EDITION_WHEN, SITE } from "@aihot/site";
import { CATEGORIES } from "@aihot/industry/taxonomy";
import { promptText } from "@aihot/backend/editorial/prompts";
import { readFileSync } from "node:fs";
import path from "node:path";

const T = tag();
const SOURCE = `test-reports-${T}`;
const WEEK = "2098-W20";
after(async () => {
  await stopBoss();
  await closeDb();
});

test("a late run writes the issue that was due, not today's", () => {
  assert.equal(dueDaily(editionAt("daily", "2026-09-29", 6)), "2026-09-29");
  assert.equal(dueDaily(editionAt("daily", "2026-09-30", -60)), "2026-09-29", "the 29th's run delayed until just before the next issue");
  assert.equal(dueWeekly(editionAt("weekly", "2026-09-28")), "2026-W39");
  assert.equal(dueWeekly(editionAt("weekly", "2026-10-05", -60)), "2026-W39", "Monday before its edition time: the next week is not due yet");
  assert.equal(dueWeekly(editionAt("weekly", "2026-10-05", 60)), "2026-W40");
  assert.equal(dueMonthly(editionAt("monthly", "2026-10-01")), "2026-09");
  assert.equal(dueMonthly(editionAt("monthly", "2026-10-01", -60)), "2026-08");
  assert.equal(dueMonthly(editionAt("monthly", "2027-01-15")), "2026-12");
});

test("a daily with nothing judged in its window is refused, not published as a quiet day", async () => {
  const date = "2098-01-15";
  await assert.rejects(composeDaily(date), /nothing judged/);
  const [row] = await sql`SELECT 1 FROM reports WHERE kind = 'daily' AND key = ${date}`;
  assert.equal(row, undefined);
});

test("a weekly that froze no summaries shows the articles' public summaries", async () => {
  await sql`INSERT INTO sources (id, name, kind, tier, participation_mode, next_fetch_at) VALUES (${SOURCE}, 'Reports', 'rss', 'T1', 'editorial', '2100-01-01')`;
  // Found, published and released a minute ago: a rolling window that ends at the reader's clock holds it.
  const minuteAgo = new Date(Date.now() - 60_000);
  const { articleId } = await upsertMaterial({ sourceId: SOURCE, url: `https://example.com/${T}`, title: `R ${T}`, bodyText: "b", bodyHtml: "<p>b</p>", bodyStatus: "ok", via: "fetch", publishedAt: minuteAgo, discoveredAt: minuteAgo });
  await sql`INSERT INTO analyses (article_id, input_revision, origin, relevance, category, title_zh, summary_zh, score, selected)
            VALUES (${articleId}, 1, 'rule', 'pass', 'industry', ${`标题-${T}`}, ${`公开摘要-${T}`}, 80, true)`;
  await publishArticle(articleId, { releasedAt: minuteAgo });
  const content = { kind: "weekly", title: `${SITE.name} 周报 · ${WEEK}`, overview: "o", themes: [{ heading: "h", summary: "s", storyRefs: [{ itemId: articleId, title: `标题-${T}`, sourceName: "Old aggregator", sourceId: "old-source", firstParty: false, sourceUrl: "https://example.com" }] }] };
  await sql`INSERT INTO reports (kind, key, window_start, window_end, content, generated_at, origin)
            VALUES ('weekly', ${WEEK}, now(), now(), ${sql.json(content as never)}, now(), 'imported')`;
  const report = await loadReport("weekly", WEEK);
  assert.equal(report?.sections[0]?.items[0]?.summary, `公开摘要-${T}`);
  assert.equal(report?.sections[0]?.items[0]?.sourceName, "Reports");
  assert.equal(report?.sections[0]?.items[0]?.firstParty, true, "a frozen citation cannot override verified current provenance");
  await sql`UPDATE sources SET tier = 'T1_5', first_party = true WHERE id = ${SOURCE}`;
  await publishArticle(articleId);
  assert.equal((await loadReport("weekly", WEEK))?.sections[0]?.items[0]?.firstParty, false);
});

// #8 Slice A: external configuration values used by every public outlet and deployment.
test("public config: edition times, when, site, categories", () => {
  // Edition times must be exact HH:mm used by the scheduler.
  assert.equal(EDITION_TIMES.daily, "08:00");
  assert.equal(EDITION_TIMES.weekly, "10:00");
  assert.equal(EDITION_TIMES.monthly, "10:30");

  // EDITION_WHEN uses the times in natural-language phrases (Beijing time semantics).
  assert.equal(EDITION_WHEN.daily, "每天 08:00");
  assert.equal(EDITION_WHEN.weekly, "每周一 10:00");
  assert.equal(EDITION_WHEN.monthly, "每月 1 日 10:30");

  // Site identity fields.
  assert.equal(SITE.locale, "zh-CN");
  assert.equal(SITE.footerNote, null);
  assert.equal(SITE.github, "https://github.com/lindoo67/KERNELHOT");
  assert.equal(SITE.contactEmail, null);

  // Categories: 8 keys in the public order, each with a defined Chinese section label.
  const expected = [
    { key: "security", section: "安全与修复" },
    { key: "release", section: "版本与主线" },
    { key: "subsystem", section: "子系统进展" },
    { key: "driver", section: "硬件与驱动" },
    { key: "performance", section: "性能与可靠性" },
    { key: "distro", section: "发行版内核" },
    { key: "community", section: "社区与治理" },
    { key: "article", section: "技术解读" },
  ];
  assert.equal(CATEGORIES.length, 8);
  for (let i = 0; i < 8; i++) {
    assert.equal(CATEGORIES[i].key, expected[i].key, `CATEGORIES[${i}].key`);
    assert.equal(CATEGORIES[i].section, expected[i].section, `CATEGORIES[${i}].section`);
  }
});

// #8 Slice B: the period report prompt uses Linux kernel domain vocabulary, not AI industry examples.
test("report-period prompt uses kernel domain terms, not AI examples", () => {
  const system = promptText("report-period", {
    kindName: "周报",
    span: "一周",
    sentences: "三句话",
    chars: "160",
    sections: "只写条目里有的事实",
    sectionsExample: "{}",
  });
  // The AI example terms must not appear: the prompt must not mention companies, products, models.
  assert.ok(!system.includes("公司、产品、模型和人名"), "prompt must not use AI examples (公司、产品、模型和人名)");
  // Kernel domain terms must appear: organizations, subsystems, versions, person names.
  assert.ok(/组织/.test(system), "prompt must reference organizations");
  assert.ok(/子系统/.test(system), "prompt must reference subsystems");
  assert.ok(/版本/.test(system), "prompt must reference versions");
  assert.ok(/人名/.test(system), "prompt must reference person names");
});

// #8 Slice C: policy pages await review while the changelog reflects the intranet launch.
test("policy pages await review and changelog announces the intranet launch", () => {
  const ROOT = path.resolve(import.meta.dirname, "..");

  // terms.md and privacy.md should say they need final confirmation by the operator.
  const terms = readFileSync(path.join(ROOT, "site/pages/terms.md"), "utf8");
  const privacy = readFileSync(path.join(ROOT, "site/pages/privacy.md"), "utf8");
  assert.ok(/待最终确认|待运营者|待确认|待审阅/.test(terms), "terms.md must state it needs final operator review");
  assert.ok(/待最终确认|待运营者|待确认|待审阅/.test(privacy), "privacy.md must state it needs final operator review");

  const changelogRaw = readFileSync(path.join(ROOT, "site/changelog.json"), "utf8");
  const changelog = JSON.parse(changelogRaw);
  const latest = changelog.releases[0];
  assert.equal(changelog.latestVersion, `${latest.date}T${latest.time}`);
  assert.equal(latest.kind, "公告");
  assert.match(`${latest.title}\n${latest.body.join("\n")}`, /内网.*(?:上线|开放访问)/);
});
