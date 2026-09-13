import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const installer = fileURLToPath(new URL("../scripts/install-harness.mjs", import.meta.url));
for (const [host, file, content] of [
  ["claude", ".mcp.json", '{"mcpServers":{"learn":{"command":"my-existing-server"}}}'],
  ["opencode", "opencode.jsonc", '{"mcp":{"learn":{"enabled":false}}}'],
  ["codex", ".codex/config.toml", '[mcp_servers.learn]\ncommand = "my-existing-server"\n'],
]) {
  test(`${host}: preserve an existing different learn MCP entry`, (t) => {
    const root = mkdtempSync(join(tmpdir(), "learn-conflict-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const path = join(root, file);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    const result = spawnSync(process.execPath, [installer, "--harness", host, "--project", root, "--with-mcp"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /existing .*MCP configuration differs/);
    assert.equal(readFileSync(path, "utf8"), content);
    assert.equal(existsSync(join(root, host === "claude" ? ".claude" : host === "codex" ? ".agents" : ".opencode", "skills")), false);
  });
}
