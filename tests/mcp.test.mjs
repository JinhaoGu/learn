import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const server = fileURLToPath(new URL("../adapters/mcp/server.mjs", import.meta.url));
const unpack = (result) => JSON.parse(result.content[0].text);

test("MCP stdio: discover, quiz, grade, append notes, render and handle failures", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "learn-mcp-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = join(root, "workspace with spaces");
  await mkdir(workspace);
  const client = new Client({ name: "learn-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath, args: [server, "--workspace", workspace],
    env: { ...process.env, LEARN_MMDC: join(root, "missing-mmdc") },
    stderr: "pipe",
  });
  await client.connect(transport);
  t.after(() => client.close());
  const names = (await client.listTools()).tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, ["learn_note_append", "learn_quiz_answer", "learn_quiz_create", "learn_render"]);
  const call = (name, args) => client.callTool({ name, arguments: args });
  const quizArgs = { question: "2 + 2 = ?", options: ["3", "4", "5"], correct: "B", explanation: "Two pairs contain four items." };
  const quiz = unpack(await call("learn_quiz_create", quizArgs));
  assert.equal(quiz.correct, undefined);
  assert.equal(quiz.explanation, undefined);
  assert.deepEqual(quiz.options.map((option) => option.label), ["A", "B", "C"]);
  assert.equal((await call("learn_quiz_create", { ...quizArgs, correct: "H" })).isError, true);
  assert.equal((await call("learn_quiz_create", { ...quizArgs, options: ["4", "4"] })).isError, true);
  assert.equal((await call("learn_quiz_answer", { id: quiz.id, answer: "H" })).isError, true);
  const wrong = unpack(await call("learn_quiz_answer", { id: quiz.id, answer: "A" }));
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.correct, "B");
  assert.deepEqual(unpack(await call("learn_quiz_answer", { id: quiz.id, answer: "B" })), wrong);
  const second = unpack(await call("learn_quiz_create", quizArgs));
  assert.equal(unpack(await call("learn_quiz_answer", { id: second.id, answer: "b" })).isCorrect, true);
  assert.equal((await call("learn_quiz_answer", { id: "00000000-0000-4000-8000-000000000000", answer: "A" })).isError, true);

  assert.equal((await call("learn_note_append", { path: "notes/lesson.md", markdown: "# Addition" })).isError, undefined);
  await call("learn_note_append", { path: "notes/lesson.md", markdown: "Two pairs contain four items." });
  assert.equal(await readFile(join(workspace, "notes/lesson.md"), "utf8"), "# Addition\n\nTwo pairs contain four items.\n\n");
  assert.equal((await call("learn_note_append", { path: "../escape.md", markdown: "No" })).isError, true);
  assert.equal((await call("learn_note_append", { path: "notes/not-markdown.txt", markdown: "No" })).isError, true);
  await symlink(root, join(workspace, "outside"), "dir");
  assert.equal((await call("learn_note_append", { path: "outside/escape.md", markdown: "No" })).isError, true);
  await symlink(join(root, "not-created.md"), join(workspace, "dangling.md"));
  assert.equal((await call("learn_note_append", { path: "dangling.md", markdown: "No" })).isError, true);
  await assert.rejects(readFile(join(root, "not-created.md")), { code: "ENOENT" });

  const render = await call("learn_render", {
    format: "svg", slug: "two-pairs",
    source: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="white"/><circle cx="25" cy="25" r="10" fill="blue"/></svg>',
  });
  assert.equal(render.isError, undefined);
  assert.equal(unpack(render).visuallyVerified, false);
  const image = render.content.find((item) => item.type === "image");
  assert.equal(image.mimeType, "image/png");
  const png = Buffer.from(image.data, "base64");
  assert.equal((await sharp(png).metadata()).width, 100);
  assert.deepEqual(await readFile(unpack(render).path), png);
  assert.equal((await call("learn_render", { format: "svg", source: "not SVG" })).isError, true);
  const missing = await call("learn_render", { format: "mermaid", source: "graph LR\n A --> B" });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /source preserved.*Install @mermaid-js\/mermaid-cli/s);
  // Rendering errors must not kill the MCP session.
  assert.equal((await client.listTools()).tools.length, 4);
});
