// Optional local smoke checks. No model calls, credentials, or user config edits.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const installer = fileURLToPath(new URL("./install-harness.mjs", import.meta.url));
const root = mkdtempSync(join(tmpdir(), "learn-host-check-"));
function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 60000, env: { ...process.env, ...env } });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} failed: ${result.stderr}`);
  return result.stdout;
}
try {
  for (const host of ["claude", "codex", "opencode"]) {
    const executable = spawnSync(host, ["--version"], { encoding: "utf8", timeout: 15000 });
    if (executable.error?.code === "ENOENT") { console.log(`SKIP ${host}: CLI not installed`); continue; }
    assert.equal(executable.status, 0, `${host} --version failed`);
    const project = join(root, host);
    mkdirSync(project);
    run(process.execPath, [installer, "--harness", host, "--project", project, "--with-mcp"], project);
    if (host === "opencode") {
      const env = { OPENCODE_PURE: "1" };
      const skills = JSON.parse(run(host, ["debug", "skill"], project, env));
      for (const name of ["teach", "visualize"]) assert.ok(skills.some((skill) => skill.name === name && skill.location.includes(project)));
      const agent = JSON.parse(run(host, ["debug", "agent", "learn-researcher"], project, env));
      assert.equal(agent.mode, "subagent");
      const mcp = run(host, ["mcp", "list"], project, env);
      assert.match(mcp, /learn/);
      assert.match(mcp, /connected/);
      console.log(`PASS ${host}: native skill discovery, agent loading, MCP connection`);
    } else if (host === "codex") {
      // Treat the disposable config as CODEX_HOME to validate it without adding
      // this disposable project to the user's trusted-project registry.
      const config = JSON.parse(run(host, ["mcp", "get", "learn", "--json"], project, { CODEX_HOME: join(project, ".codex") }));
      assert.equal(config.name, "learn");
      console.log(`PASS ${host}: native MCP configuration parser (skills/agents covered by installation tests)`);
    } else {
      const config = run(host, ["mcp", "get", "learn"], project);
      assert.match(config, /learn:/);
      assert.match(config, /Project config/);
      console.log(`PASS ${host}: native project MCP discovery${config.includes("Pending approval") ? " (activation awaits project approval)" : ""}; skills/agents covered by installation tests`);
    }
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
