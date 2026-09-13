import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hosts = { claude: ".claude", codex: ".agents", opencode: ".opencode" };

function entryInfo(path) {
  try { return lstatSync(path); } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function install() {
  const { values } = parseArgs({ options: {
    harness: { type: "string" }, project: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    "with-mcp": { type: "boolean", default: false },
  } });
  const host = values.harness;
  if (!Object.hasOwn(hosts, host) || !values.project) throw new Error("Usage: node scripts/install-harness.mjs --harness claude|codex|opencode --project /path/to/project [--with-mcp] [--dry-run]");
  const project = resolve(values.project);
  if (!existsSync(project) || !lstatSync(project).isDirectory()) throw new Error("Project must be an existing directory.");
  const files = new Map();
  const originals = new Map();
  const command = [process.execPath, join(repo, "adapters", "mcp", "server.mjs"), "--workspace", project];
  function collect(source, target) {
    for (const entry of readdirSync(source, { withFileTypes: true })) {
      if (entry.isDirectory()) collect(join(source, entry.name), join(target, entry.name));
      else if (entry.isFile()) files.set(join(target, entry.name), readFileSync(join(source, entry.name)));
    }
  }
  for (const name of ["teach", "visualize"]) collect(join(repo, "skills", name), join(project, hosts[host], "skills", name));

  for (const [role, description] of [
    ["researcher", "Verify lesson facts and prerequisites using authoritative sources."],
    ["visual-maker", "Create and inspect one minimal Mermaid or SVG lesson diagram."],
  ]) {
    const name = `learn-${role}`;
    const body = readFileSync(join(repo, "adapters", "agents", `${role}.md`), "utf8");
    const content = host === "codex"
      ? `name = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(description)}\ndeveloper_instructions = ${JSON.stringify(body)}\n`
      : `---\nname: ${name}\ndescription: ${description}\n${host === "opencode" ? "mode: subagent\n" : ""}---\n\n${body}`;
    files.set(join(project, host === "codex" ? ".codex" : hosts[host], "agents", `${name}.${host === "codex" ? "toml" : "md"}`), Buffer.from(content));
  }

  if (values["with-mcp"]) {
    let target;
    let updated;
    if (host === "codex") {
      const { parse } = require("smol-toml");
      target = join(project, ".codex", "config.toml");
      const original = existsSync(target) ? readFileSync(target, "utf8") : "";
      const config = parse(original);
      const desired = { command: command[0], args: command.slice(1), tool_timeout_sec: 150 };
      if (config.mcp_servers?.learn !== undefined) {
        if (!isDeepStrictEqual(config.mcp_servers.learn, desired)) throw new Error("An existing Codex learn MCP configuration differs; review it before installing.");
        updated = original;
      } else {
        updated = `${original}\n[mcp_servers.learn]\ncommand = ${JSON.stringify(command[0])}\nargs = ${JSON.stringify(command.slice(1))}\ntool_timeout_sec = 150\n`;
        parse(updated); // Detect incompatible inline/sealed tables before writing.
      }
    } else {
      const { parse, modify, applyEdits } = require("jsonc-parser");
      target = join(project, host === "claude" ? ".mcp.json" : existsSync(join(project, "opencode.jsonc")) ? "opencode.jsonc" : "opencode.json");
      if (host === "opencode" && existsSync(join(project, "opencode.jsonc")) && existsSync(join(project, "opencode.json"))) throw new Error("Both opencode.json and opencode.jsonc exist; choose one before installing MCP.");
      const original = existsSync(target) ? readFileSync(target, "utf8") : "{}\n";
      const errors = [];
      const config = parse(original, errors, { allowTrailingComma: host === "opencode", disallowComments: host === "claude" });
      if (errors.length || !config || Array.isArray(config) || typeof config !== "object") throw new Error(`Invalid configuration: ${target}`);
      const key = host === "claude" ? "mcpServers" : "mcp";
      const desired = host === "claude" ? { command: command[0], args: command.slice(1) } : { type: "local", command, enabled: true, timeout: 150000 };
      if (config[key]?.learn !== undefined && !isDeepStrictEqual(config[key].learn, desired)) throw new Error(`An existing learn MCP configuration differs: ${target}`);
      if (config[key] !== undefined && (!config[key] || Array.isArray(config[key]) || typeof config[key] !== "object")) throw new Error(`Invalid ${key} object: ${target}`);
      const options = { formattingOptions: { insertSpaces: true, tabSize: 2 } };
      updated = applyEdits(original, modify(original, [key, "learn"], desired, options));
      if (host === "opencode" && !config.$schema) updated = applyEdits(updated, modify(updated, ["$schema"], "https://opencode.ai/config.json", options));
    }
    if (existsSync(target)) originals.set(target, readFileSync(target));
    files.set(target, Buffer.from(updated));
  }

  // Preflight the entire plan so a conflict never leaves a half-installed adapter.
  for (const [target, content] of files) {
    for (let current = target; current !== project; current = dirname(current)) {
      const info = entryInfo(current);
      if (info) {
        if (info.isSymbolicLink()) throw new Error(`Refusing to write through a symlink: ${current}`);
        if (current !== target && !info.isDirectory()) throw new Error(`Not a directory: ${current}`);
      }
    }
    if (existsSync(target) && (!lstatSync(target).isFile() || (!originals.has(target) && !readFileSync(target).equals(content)))) {
      throw new Error(`Existing file differs; review and move it before installing: ${target}`);
    }
  }
  for (const [target, content] of files) {
    console.log(`${values["dry-run"] ? "Would install" : "Install"} ${target}`);
    if (!values["dry-run"] && (!existsSync(target) || originals.has(target))) {
      mkdirSync(dirname(target), { recursive: true });
      if (originals.has(target)) {
        if (!readFileSync(target).equals(originals.get(target))) throw new Error(`Configuration changed during install: ${target}`);
        writeFileSync(target, content);
      } else writeFileSync(target, content, { flag: "wx" });
    }
  }
  console.log(`\n${values["with-mcp"] ? "Configured" : "Optional"} MCP configuration (install dependencies with npm ci in the learn repository first):`);
  if (host === "codex") {
    console.log(`[mcp_servers.learn]\ncommand = ${JSON.stringify(command[0])}\nargs = ${JSON.stringify(command.slice(1))}\ntool_timeout_sec = 150`);
    console.log("Merge into the project's .codex/config.toml; the project must be trusted for project config to load.");
  } else if (host === "claude") {
    console.log(JSON.stringify({ mcpServers: { learn: { command: command[0], args: command.slice(1) } } }, null, 2));
    console.log("Merge into the project's .mcp.json, or register with claude mcp add --scope project learn -- <command and args above>.");
  } else {
    console.log(JSON.stringify({ $schema: "https://opencode.ai/config.json", mcp: { learn: { type: "local", command, enabled: true, timeout: 150000 } } }, null, 2));
    console.log("Merge into the project's opencode.json or opencode.jsonc.");
  }
  console.log("Keep the learn repository at this path. Restart the harness after setup. See docs/harnesses.md for usage and checks.");
}

try { install(); } catch (error) { console.error(error.message); process.exitCode = 1; }
