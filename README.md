# learn

English | [简体中文](README.zh-CN.md)

[![video](assets/thumbnail.png)](https://www.youtube.com/watch?v=kzcI5F4tGiU)

An AI learning system based on the approach shown in [How I Use AI to Learn Things](https://www.youtube.com/watch?v=kzcI5F4tGiU).

The teaching behavior is now **harness-neutral**. The two core skills describe capabilities rather than Pi-specific tool names, paths, UI components, model providers, or note formats. They work with a rich agent harness when those capabilities exist and degrade to ordinary chat and Markdown when they do not.

## Portable core

- `skills/teach/` — probes the learner's current edge, plans a dependency graph, and teaches from unconditional truths through motivated discovery.
- `skills/visualize/` — adds one minimal diagram when structure or geometry is clearer visually.

Both are standard `SKILL.md` directories. Copy either directory into the skill location recognized by your harness, or point your harness at this repository's `skills/` directory. Harnesses use different discovery locations, so consult the host's skill-loading documentation.

```bash
git clone https://github.com/JinhaoGu/learn.git
# Install or link learn/skills/teach and learn/skills/visualize
# into your harness's skill directory.
```

## Claude Code, Codex, and OpenCode adapters

Install skills, native research/visual agents, and a local MCP service providing
quiz grading, curated Markdown notes, and SVG/Mermaid rendering. From this clone
(Node.js 22+), choose your harness and an existing project:

```bash
npm ci
node scripts/install-harness.mjs --harness claude --project /absolute/my-project --with-mcp
# --harness also accepts codex or opencode
```

Restart the harness, then use `/teach` in Claude Code, `$teach` in Codex, or ask
OpenCode to use the `teach` skill. Native question UI is used when available;
otherwise the lesson and quiz run in chat. SVG rendering is bundled; Mermaid
rendering additionally needs `@mermaid-js/mermaid-cli` and its browser.

See [installation, feature mapping, and verification](docs/harnesses.md) for
configuration paths, optional skills-only installation, and acceptance checks.
Automated checks cover installation and the MCP protocol; full model-driven
teaching sessions still need verification in each chosen host/version.

## Capability fallbacks

The portable skills discover and use whatever the active harness exposes:

| Capability | Rich integration | Portable fallback |
| --- | --- | --- |
| Questions | Structured user-input UI | Ask one concise question in chat |
| Knowledge checks | Interactive graded quiz | Present options in chat, then grade the reply |
| Fact checking | Search tools or a research subagent | Search directly; disclose uncertainty if browsing is unavailable |
| Visuals | Diagram/image tools plus render inspection | Mermaid source, SVG, or a compact text representation |
| Lesson notes | A configured note-writing tool | Authorized Markdown file, or keep the lesson in chat |
| Delegation | Specialist subagents | Perform the work in the main agent |

Missing optional capabilities never prevent the core teaching workflow from running.

## Optional Pi adapter

This repository originated as a Pi project configuration, so the following files remain as an optional enhanced adapter:

- `extensions/ask-user-question.ts` — structured preference and direction questions
- `extensions/quiz.ts` — graded questions with instant feedback
- `extensions/md-log.ts` — curated Markdown/Obsidian lesson notes
- `extensions/skill-stats.ts` — persistent skill invocation counters
- `extensions/visual-tools/` — Mermaid and SVG authoring/rendering tools
- `agents/` — Pi-specific researcher and visual-maker definitions

To use that adapter, clone the repository as the project's `.pi` directory and satisfy the Pi extension dependencies:

```bash
git clone https://github.com/JinhaoGu/learn.git .pi
```

The portable skills do not require these extensions or agent definitions. Other harnesses can provide equivalent capabilities under any names; the skills adapt to what is actually available.

### Pi skill usage statistics

After loading the Pi adapter, run:

```text
/skill-stats
/skill-stats teach
```

The counter records explicit `/skill:name` commands and automatic `SKILL.md` reads. Repeated reads of the same skill in one agent turn count once. Statistics start after this extension is installed and are stored locally in `~/.pi/agent/skill-usage.jsonl`; prompts and lesson content are never recorded.

## Design boundary

The teaching philosophy is portable; extension implementations are not. A TUI popup, event hook, or tool-registration API necessarily belongs to a specific host. Rather than pretending those APIs are universal, the skills specify the behavior and fallback contract while each harness supplies its own optional adapter.
