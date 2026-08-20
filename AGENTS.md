# AGENTS.md

## Agent skills

### Issue tracker

Issues and PRDs live as local markdown files under `.scratch/<feature>/`. External MRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Coding standards

Testing, interface design and **comments** — a comment answers what the code cannot, and Fowler's *Comments* smell applies. Read before writing or reviewing code: `docs/standards/CODING_STANDARDS.md`.

## Skills

When implementing or changing behavior, use the /tdd skill.