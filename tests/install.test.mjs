import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse as parseToml } from "smol-toml";
import { parse as parseJsonc } from "jsonc-parser";

const script = fileURLToPath(new URL("../scripts/install-harness.mjs", import.meta.url));
function project(t) {
  const root = mkdtempSync(join(tmpdir(), "learn-install-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
const run = (host, root, ...args) => spawnSync(process.execPath, [script, "--harness", host, "--project", root, ...args], { encoding: "utf8" });

for (const [host, base] of Object.entries({ claude: ".claude", codex: ".agents", opencode: ".opencode" })) {
  test(`${host}: install skills, native agents and merge MCP without losing existing config`, (t) => {
    const root = project(t);
    const config = join(root, host === "claude" ? ".mcp.json" : host === "codex" ? ".codex/config.toml" : "opencode.jsonc");
    mkdirSync(dirname(config), { recursive: true });
    writeFileSync(config, host === "codex" ? '# Keep this comment\nmodel = "test-model"\n' : host === "opencode" ? '{\n// Keep this comment\n"model": "test/model"\n}\n' : '{"mcpServers":{"other":{"command":"existing"}}}\n');
    const dry = run(host, root, "--with-mcp", "--dry-run");
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(existsSync(join(root, base, "skills/teach/SKILL.md")), false);
    const result = run(host, root, "--with-mcp");
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(join(root, base, "skills/teach/SKILL.md"), "utf8"), /name: teach/);
    assert.ok(existsSync(join(root, base, "skills/teach/references/learn-tools.md")));
    assert.match(readFileSync(join(root, base, "skills/visualize/SKILL.md"), "utf8"), /learn_render/);
    const agent = join(root, host === "codex" ? ".codex" : base, "agents", `learn-researcher.${host === "codex" ? "toml" : "md"}`);
    const body = readFileSync(agent, "utf8");
    if (host === "codex") assert.match(parseToml(body).developer_instructions, /primary sources/);
    else assert.match(body, host === "opencode" ? /mode: subagent/ : /name: learn-researcher/);
    const content = readFileSync(config, "utf8");
    const parsed = host === "codex" ? parseToml(content) : parseJsonc(content);
    const mcp = parsed[host === "codex" ? "mcp_servers" : host === "claude" ? "mcpServers" : "mcp"].learn;
    assert.ok((host === "opencode" ? mcp.command : mcp.args).includes(root));
    if (host !== "claude") assert.match(content, /Keep this comment/);
    else assert.equal(parsed.mcpServers.other.command, "existing");
    assert.equal(run(host, root, "--with-mcp").status, 0);
  });
}

test("installation refuses conflicts before writing any skill", (t) => {
  const root = project(t);
  const path = join(root, ".claude/agents/learn-researcher.md");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "User's custom agent");
  const result = run("claude", root, "--with-mcp");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Existing file differs/);
  assert.equal(readFileSync(path, "utf8"), "User's custom agent");
  assert.equal(existsSync(join(root, ".claude/skills")), false);
  assert.equal(existsSync(join(root, ".mcp.json")), false);
});

test("installation refuses symlinked destinations and malformed configs", (t) => {
  const root = project(t);
  const outside = project(t);
  symlinkSync(outside, join(root, ".claude"), "dir");
  assert.notEqual(run("claude", root).status, 0);
  assert.equal(existsSync(join(outside, "skills")), false);
  writeFileSync(join(root, "opencode.json"), "{ broken");
  assert.notEqual(run("opencode", root, "--with-mcp").status, 0);
  assert.equal(existsSync(join(root, ".opencode")), false);
});
