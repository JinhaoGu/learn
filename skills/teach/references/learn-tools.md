# Optional learn MCP workflow

Match tools by their exposed names/descriptions: hosts may prefix them with the
server name. These tools are optional; ordinary chat and native file tools remain
the fallback. Never assume they exist merely because this reference is present.

## Questions and checks

Use the host's native user-input tool for preferences and direction; use chat if
it is unavailable. Do not run a second terminal UI through a shell tool.

For a single-answer knowledge check:
1. Prepare balanced, bare-claim options and a verified answer/explanation.
2. Call `learn_quiz_create` with `question`, `options` (an array of strings),
   `correct` (a letter such as `B`), and `explanation`.
3. Present only the returned question and labeled options. Use native choice UI
   only if it can preserve every option without truncation; otherwise use chat.
   Do not mark a recommended choice or expose the key/explanation to the learner.
   Tool arguments may be visible in a host's logs: this is practice, not a secure exam.
4. Stop and wait for the learner. Map their unambiguous reply to a label; clarify
   ambiguous replies instead of guessing. Call `learn_quiz_answer` with `id` and
   the actual `answer`. Never submit on the learner's behalf before they reply.
5. Present the grade and reasoning. Repair misconceptions before the next node.

Keep the quiz ID in conversation context. Quizzes are in-memory (latest 200 per
server process). If the server restarts or the quiz expires, recreate and present
it again; never pretend an expired quiz was graded. A retry of an answer returns
the first result. For multi-answer or free-response checks, grade in chat instead.

## Notes

Once the user chooses a writable Markdown path, call `learn_note_append` with
`path` and curated `markdown` as each teaching section is delivered. The path
must be inside the MCP server's configured workspace. Append sequentially; there
is no automatic transcript hook and repeating an append duplicates that section.
Include answered questions, learner answers, and explanations. Exclude setup,
permissions, status, scope negotiation, and other non-teaching conversation.
If append fails, surface the failure and retain the pending content for retry.
Use native file tools for a user-authorized destination outside this workspace.

## Research and visuals

Search with the host's browsing tools or an available `learn-researcher` agent.
For visuals, use `visualize` and optionally `learn-visual-maker`. Keep learner
interaction and the final note-writing in the main teacher, not a worker agent.
