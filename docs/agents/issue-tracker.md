# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."` — this always acts on `lindoo67/KERNELHOT`, never on `KKKKhazix/AIHOT`.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments --repo lindoo67/KERNELHOT`.
- **List issues**: `gh issue list --state open --repo lindoo67/KERNELHOT --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> --repo lindoo67/KERNELHOT ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/lindoo67/KERNELHOT/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking** below). Without sub-issues, put `Part of #<parent>` at the top of the child body.
- **Comment on an issue**: `gh issue comment <number> --repo lindoo67/KERNELHOT --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo lindoo67/KERNELHOT --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo lindoo67/KERNELHOT --comment "..."`

Every `gh` command must include `--repo lindoo67/KERNELHOT` to target this repository explicitly. Do not rely on `git remote -v` alone, since this worktree may be cloned from a fork or have multiple remotes.

## Pull requests as a request surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --repo lindoo67/KERNELHOT --comments` and `gh pr diff <number> --repo lindoo67/KERNELHOT` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/lindoo67/KERNELHOT/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment --repo lindoo67/KERNELHOT`, `gh pr edit --repo lindoo67/KERNELHOT --add-label`/`--remove-label`, `gh pr close --repo lindoo67/KERNELHOT`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42 --repo lindoo67/KERNELHOT` and fall back to `gh issue view 42 --repo lindoo67/KERNELHOT`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue on `lindoo67/KERNELHOT` with `--repo lindoo67/KERNELHOT`.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label wayfinder:map --repo lindoo67/KERNELHOT`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (see **Make an issue a sub-issue of a parent**). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/lindoo67/KERNELHOT/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/lindoo67/KERNELHOT/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open --repo lindoo67/KERNELHOT`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --repo lindoo67/KERNELHOT --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --repo lindoo67/KERNELHOT --body "<answer>"`, then `gh issue close <n> --repo lindoo67/KERNELHOT`, then append a context pointer (gist + link) to the map's Decisions-so-far.
