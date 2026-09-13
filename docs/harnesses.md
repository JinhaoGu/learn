# Claude Code, Codex, and OpenCode

This adapter provides the same teaching workflow using standard skills, native
specialist agents, and an optional **local stdio MCP server**. It does not require
a hosted service. Questions use the host's UI or chat; the Pi TUI is not required.

## Install

Requires Node.js 22+ and npm. Clone the repository to a stable location, then run
these commands **from the cloned repository**. Replace `/absolute/my-project`
with an existing project directory where you will start your harness:

```bash
npm ci
node scripts/install-harness.mjs --harness claude --project /absolute/my-project --with-mcp
# Or choose one of:
node scripts/install-harness.mjs --harness codex --project /absolute/my-project --with-mcp
node scripts/install-harness.mjs --harness opencode --project /absolute/my-project --with-mcp
```

Use `--dry-run` to preview. Omit `--with-mcp` for skills and native agents only;
the installer then prints the optional MCP configuration. The skills-only
installer needs Node.js but does not need `npm ci`.

| Host | Skills | Specialist agents | MCP configuration |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills/{teach,visualize}/` | `.claude/agents/learn-*.md` | `.mcp.json` |
| Codex | `.agents/skills/{teach,visualize}/` | `.codex/agents/learn-*.toml` | `.codex/config.toml` |
| OpenCode | `.opencode/skills/{teach,visualize}/` | `.opencode/agents/learn-*.md` | `opencode.json` or existing `opencode.jsonc` |

The installer copies the complete skill folders, including references, and adds
`learn-researcher` and `learn-visual-maker` with the host's native agent format.
Models and permissions inherit from the host. Existing different skill/agent
files or a different `learn` MCP entry cause installation to stop before writing.
Unrelated configuration entries and JSONC/TOML comments are preserved. An
identical installation can be run again. To update a previously copied skill or
agent, review and move the old files first, then reinstall.

The MCP command points to the clone using an absolute path: keep that clone and
its `node_modules` in place. Each installation fixes a workspace for note and
artifact output, independent of the shell's current directory. Use project-level
configuration rather than reusing one global server for unrelated projects.

**Restart the harness after installation.** In Claude Code, enable the project
MCP server when prompted. In Codex, project configuration must be trusted; custom
agent discovery requires a version supporting standalone `.codex/agents/*.toml`.
On older versions, use the core skills with the main agent or upgrade. OpenCode
loads configuration and agent definitions at startup, so quit and restart it.

## Start a lesson

Claude Code:

```text
/teach Explain how TCP achieves reliable delivery. Save lesson notes to notes/tcp.md.
/visualize Show packet ordering and retransmission in one diagram.
```

Codex:

```text
$teach Explain how TCP achieves reliable delivery. Save lesson notes to notes/tcp.md.
$visualize Show packet ordering and retransmission in one diagram.
```

OpenCode:

```text
Use the teach skill to explain TCP reliability. Save lesson notes to notes/tcp.md.
Use the visualize skill to show packet ordering and retransmission.
```

You can also ask naturally; automatic selection depends on the model matching
the skill description. A skill's presence does not force every model response to
follow it perfectly.

## Feature mapping

| Pi feature | Other harnesses |
| --- | --- |
| Structured question popup | Native question/choice tool when exposed; otherwise one question in chat |
| Graded quiz popup | `learn_quiz_create` → native choice UI/chat → learner reply → `learn_quiz_answer` |
| Curated Markdown/Obsidian log | Teacher calls `learn_note_append` for each teaching section after a destination is selected |
| Mermaid/SVG authoring loop | Author/edit source, call `learn_render`, inspect returned PNG, revise and render again |
| Research specialist | `learn-researcher` using the host's search/browsing tools |
| Visual specialists | `learn-visual-maker` selects Mermaid or SVG and returns an inspected artifact or labeled fallback |

The main teacher owns learner interaction and notes. Notes are explicit tool
calls, not a transcript hook; host policies or model behavior can affect whether
each section is saved. The server appends Markdown without interpreting Obsidian
syntax. Use normal image links unless the destination is an Obsidian vault.

Quiz grading supports single-answer multiple choice with 2–8 letter-labeled
options. The server keeps the latest 200 quizzes in memory; a restart expires
them. Repeat grading returns the first result. Free-text and multi-answer checks
are graded in chat. Answer keys may be visible in tool arguments, so this is a
learning aid, not a secure assessment platform.

## Rendering

SVG → PNG uses bundled `sharp`; no browser or system renderer is needed on
platforms supported by sharp's prebuilt binaries. Mermaid → PNG additionally
requires the Mermaid CLI and its browser:

```bash
npm install --global @mermaid-js/mermaid-cli
mmdc --help
```

Follow [Mermaid CLI's browser setup](https://github.com/mermaid-js/mermaid-cli)
if Chromium is unavailable. If the harness has a different `PATH`, set
`LEARN_MMDC` to the absolute `mmdc` executable in the MCP server's environment
(`env` for Claude/Codex, `environment` for OpenCode). Existing Puppeteer browser
settings such as `PUPPETEER_EXECUTABLE_PATH` can be passed there too.

The server returns PNG image content and saves unique source/PNG files under
`<workspace>/.learn/viz/`. Rendering errors preserve source and return a tool
error; the teacher should use source/text fallback. A rendered image still needs
the agent's visual inspection. The renderer has a 120-second subprocess limit;
generated Codex/OpenCode configs allow 150 seconds for tool calls. If Claude's
tool timeout is shorter in your setup, increase `MCP_TOOL_TIMEOUT` to `150000` in
the environment used to launch Claude.

## Verification

```bash
npm test
# Optional: use installed host CLIs for model-free configuration/discovery checks
npm run test:harnesses
```

Automated checks start a real MCP stdio client/server and exercise discovery,
quiz creation/answer/retry, note appends, workspace boundaries, SVG PNG output,
and missing Mermaid-renderer recovery. Installation checks cover all three
layouts, native agent serialization, configuration merging, repeat installation,
dry runs, and preservation of existing files.

The optional host smoke check uses disposable projects. Local checks on
2026-09-13 confirmed Claude Code discovers the project MCP entry (activation
still requires project approval), Codex parses the generated MCP configuration,
and OpenCode discovers both skills, loads the research agent, and connects to
the MCP server. These checks do not run a model or a complete teaching session.
Mermaid's missing-renderer fallback is automated; successful Mermaid rendering
requires the separately installed CLI/browser and is a live acceptance check.

The GitHub Actions workflow runs the protocol and installation suite on Linux
and macOS with Node.js 22 and 24 when changes are pushed. It does not install or
authenticate proprietary harness clients.

For a **live harness acceptance check**, start a fresh session in the installed
project and verify:

1. Both skills and the two `learn-*` agents are discoverable. OpenCode also has
   `opencode debug skill` and `opencode debug agent learn-researcher`.
2. The `learn` MCP server connects and exposes four tools (host prefixes vary).
3. Ask for a two-option quiz. Confirm the agent waits for your actual reply,
   then grades it; inspect the call rather than accepting an invented grade.
4. Select `notes/smoke.md` and request a short lesson. Check the file contains
   teaching content and feedback, not setup chatter.
5. Request a simple SVG. Confirm a PNG is returned and inspected. Try Mermaid
   with and without its CLI to check rendering and fallback behavior.
6. Request research delegation; verify real source links or explicit uncertainty
   if the host lacks browsing/delegation.

Automated protocol/installation checks do not certify every host's model-driven
UI, skill selection, or teaching behavior. Test those in your chosen version and
model using the acceptance steps above.

References: [Claude skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://developers.openai.com/codex/build-skills),
[Codex agents](https://developers.openai.com/codex/agent-configuration/subagents),
[OpenCode skills](https://opencode.ai/docs/skills/),
[OpenCode configuration schema](https://opencode.ai/config.json).
