# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY-MAP.md`** at the repo root: it points at one `GLOSSARY.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. This holds system-wide decisions shared across all contexts.
- **`<context>/docs/adr/`**: in multi-context repos, also check context-scoped ADR directories (`site/docs/adr/`, `industry/docs/adr/`, `apps/*/docs/adr/`, `packages/*/docs/adr/`, `modules/*/docs/adr/`) for decisions specific to that context.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo (most repos):

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `GLOSSARY-MAP.md` at the root):

```
/
├── GLOSSARY-MAP.md
├── docs/adr/                          ← system-wide decisions
├── site/
│   └── docs/adr/                      ← site-specific decisions
├── industry/
│   └── docs/adr/                      ← industry-specific decisions
├── apps/
│   └── <app>/
│       └── docs/adr/                  ← app-specific decisions
├── packages/
│   └── <pkg>/
│       └── docs/adr/                  ← package-specific decisions
└── modules/
    └── <mod>/
        └── docs/adr/                  ← module-specific decisions
```

## Context roots

This repo uses multi-context. The glossary map (`GLOSSARY-MAP.md`) at the root points to per-context glossaries:

| Context   | Root path     | Description                              |
| --------- | ------------- | ---------------------------------------- |
| site      | `site/`       | Site configuration, branding, pages      |
| industry  | `industry/`   | Taxonomy, topics, sources, prompts       |
| apps      | `apps/`       | Frontend and backend applications        |
| packages  | `packages/`   | Shared libraries and utilities           |
| modules   | `modules/`    | Feature modules that extend the platform |

When working on a topic, read the `GLOSSARY.md` under the relevant context root, plus any system-level glossary entries referenced by `GLOSSARY-MAP.md`.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
