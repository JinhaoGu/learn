import { randomUUID } from "node:crypto";
import { appendFile, lstat, mkdir, realpath, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import sharp from "sharp";
import { z } from "zod";

const run = promisify(execFile);
const text = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });
const nonempty = z.string().trim().min(1);

export async function registerTools(server, workspace) {
  const root = await realpath(workspace);
  if (!(await stat(root)).isDirectory()) throw new Error("Workspace must be a directory.");
  const quizzes = new Map();

  function inside(file) {
    const rel = relative(root, file);
    if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      throw new Error("Destination must be inside the configured workspace.");
    }
    return file;
  }

  async function destination(file) {
    const target = inside(resolve(root, file));
    // lstat also detects dangling symlinks, which realpath would mistake for a
    // missing destination and appendFile could follow outside the workspace.
    let component = root;
    for (const part of relative(root, target).split(sep)) {
      component = join(component, part);
      try {
        if ((await lstat(component)).isSymbolicLink()) throw new Error("Note and artifact destinations must not traverse symbolic links.");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    await mkdir(dirname(target), { recursive: true });
    inside(await realpath(dirname(target)));
    return target;
  }

  function tool(name, description, inputSchema, handler) {
    server.registerTool(name, { description, inputSchema }, async (args) => {
      try {
        return await handler(args);
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    });
  }

  tool("learn_quiz_create", "Prepare a single-answer knowledge check. Present only the returned question/options using native input UI or chat, then wait for the learner. Do not reveal the answer key or invent a reply. Quizzes last until this MCP process restarts (latest 200 retained).", {
    question: nonempty.max(10000),
    options: z.array(nonempty.max(2000)).min(2).max(8),
    correct: z.string().regex(/^[A-H]$/),
    explanation: nonempty.max(10000),
  }, async ({ question, options, correct, explanation }) => {
    if (correct.charCodeAt(0) - 65 >= options.length) throw new Error("Correct label is outside the options.");
    if (new Set(options).size !== options.length) throw new Error("Options must be distinct.");
    const id = randomUUID();
    const labeled = options.map((option, index) => ({ label: String.fromCharCode(65 + index), text: option }));
    quizzes.set(id, { question, options: labeled, correct, explanation });
    if (quizzes.size > 200) quizzes.delete(quizzes.keys().next().value);
    return text({ id, question, options: labeled });
  });

  tool("learn_quiz_answer", "Grade the learner's actual answer after they reply. Repeat submissions return the original result; create a new quiz for another attempt. Explain the result and repair misconceptions before continuing.", {
    id: z.string().uuid(),
    answer: z.string().trim().toUpperCase().regex(/^[A-H]$/),
  }, async ({ id, answer }) => {
    const quiz = quizzes.get(id);
    if (!quiz) throw new Error("Quiz expired or unknown. Recreate it before asking again.");
    if (!quiz.options.some((option) => option.label === answer)) throw new Error("Answer is outside the options.");
    quiz.result ??= { id, question: quiz.question, options: quiz.options, answer, correct: quiz.correct, isCorrect: answer === quiz.correct, explanation: quiz.explanation };
    return text(quiz.result);
  });

  tool("learn_note_append", "Append curated teaching Markdown to a user-selected .md file inside the workspace. Use only after the user requests or selects a note destination. Include lesson content and answered quizzes; exclude setup/status/chat transcripts. Call sequentially, once per content section.", {
    path: nonempty,
    markdown: nonempty.max(100000),
  }, async ({ path, markdown }) => {
    if (!path.toLowerCase().endsWith(".md")) throw new Error("Lesson notes must use a .md file.");
    const target = await destination(path);
    await appendFile(target, `${markdown}\n\n`, { encoding: "utf8", mode: 0o600 });
    return text({ path: target, appended: true });
  });

  tool("learn_render", "Render one SVG or Mermaid diagram to PNG and return an image for inspection. Each call saves a new source and PNG under .learn/viz in the workspace. Revise source and call again to iterate. Rendering is not visual verification: inspect the returned image before claiming correctness. Mermaid requires mmdc on PATH or LEARN_MMDC.", {
    format: z.enum(["svg", "mermaid"]),
    source: nonempty.max(200000),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).default("diagram"),
  }, async ({ format, source, slug }) => {
    const stem = `${slug}-${randomUUID()}`;
    const input = await destination(join(".learn", "viz", `${stem}.${format === "svg" ? "svg" : "mmd"}`));
    const output = await destination(join(".learn", "viz", `${stem}.png`));
    await writeFile(input, source, { encoding: "utf8", flag: "wx" });
    let png;
    if (format === "svg") {
      png = await sharp(Buffer.from(source), { limitInputPixels: 16000000 })
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .png().toBuffer();
    } else {
      try {
        await run(process.env.LEARN_MMDC || "mmdc", ["-i", input, "-o", output, "-b", "white"], {
          cwd: root, timeout: 120000, maxBuffer: 1024 * 1024,
        });
      } catch (error) {
        throw new Error(`Mermaid rendering failed; source preserved at ${input}. ${error.code === "ENOENT" ? "Install @mermaid-js/mermaid-cli and its browser, or set LEARN_MMDC to the mmdc executable." : (error.stderr || error.message)} Return source/text fallback if rendering is unavailable.`);
      }
      png = await sharp(output).resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).png().toBuffer();
    }
    await writeFile(output, png);
    return { content: [
      { type: "text", text: JSON.stringify({ sourcePath: input, path: output, rendered: true, visuallyVerified: false }) },
      { type: "image", data: png.toString("base64"), mimeType: "image/png" },
    ] };
  });
}
