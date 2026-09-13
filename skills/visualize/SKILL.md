---
name: visualize
description: Add one correct, minimal visual when a lesson is materially clearer as a picture. Works across agent harnesses by selecting available diagram, image, file, rendering, and delegation capabilities; use for relationships, flows, sequences, hierarchies, comparisons, or spatial and geometric ideas.
---

# Visualize

A picture earns its place only when it shows something prose cannot show as clearly: shape, structure, direction, relationship, or geometry. Produce **one** such picture, keep it minimal, verify it as far as the available tools allow, and present it in a format the learner can see.

## Harness portability

This skill is capability-based. Do not assume Pi, a `subagent` tool, `.pi/agents`, custom visual tools, Obsidian, or any fixed filesystem layout.

Inspect the capabilities already available in the current harness and choose the smallest viable path:

1. Use a native diagram, canvas, image-generation, or SVG capability when it fits.
2. Delegate to a diagram-making subagent only when the harness supports delegation and the subagent has the required authoring and inspection capabilities.
3. For a structural visual, a fenced Mermaid block is the portable source fallback. If the interface cannot render Mermaid, give the source and a compact text representation.
4. For a spatial visual, create SVG with ordinary file-writing tools when permitted. If the interface cannot display the file, link it or provide the essential geometry in text.
5. A missing renderer, image viewer, subagent, note tool, or vault must not block the lesson. Be explicit when a result is source-only rather than visually verified.

Never invent a tool name. Use the tools and authorization model exposed by the active harness.

If the optional learn MCP server exposes `learn_render`, pass `format` (`mermaid` or `svg`), complete `source`, and a short kebab-case `slug`. It saves source and PNG under the configured workspace's `.learn/viz/` and returns the image plus absolute paths. Inspect the returned image when supported, revise the source, and render again as needed. SVG rendering is bundled; Mermaid needs a separately installed Mermaid CLI/browser. On a missing renderer or render error, use the source/text fallback above. A successful render is not proof that you visually inspected it. Link the returned path, using a relative image path when embedding into a Markdown note.

## When to visualize

Use a visual when the idea is:

- **Structural or relational:** dependencies, a system with parts and arrows, a flow or pipeline, a sequence, a state machine, a tree or hierarchy, a comparison, or containment.
- **Spatial or geometric:** coordinate geometry, a number line, vectors, a function's shape, or a physical arrangement.

Do not visualize when prose or one equation already carries the idea. A decorative diagram adds noise and another chance to be wrong.

## Choose the representation

- **Mermaid** is the default for nodes-and-edges: dependency graphs, flowcharts, sequences, states, ER/class diagrams, trees, mind maps, and timelines.
- **SVG or a native drawing/image tool** is better for exact positions and shapes: geometry, coordinates, number lines, vectors, plots, and custom layouts.
- **Text** is the final fallback when no visible artifact can be produced. Preserve the important relationships, and do not claim the visual was rendered or inspected.

## Distill the brief

Act as the creative director before authoring or delegating. State the one idea the visual must carry and the fewest concrete elements needed. For each element ask: “If I delete this, is the idea still clear?” If yes, delete it. More than roughly seven elements is a signal to simplify, not a hard limit.

- Bad: “Make a diagram about how TCP works.”
- Better: “Show packet delivery branching into ordering and retransmission, which combine into a reliable stream. Emphasize that reliability is built from packet handling.”

## Author, verify, and iterate

1. Create the Mermaid, SVG, or image using the chosen local capability. If delegating, pass the distilled brief and require the worker to return the artifact path or source.
2. Render a preview when a renderer exists.
3. Inspect the rendered result when an image-viewing capability exists. Check arrow directions, labels, coordinates, proportions, clipping, overlap, and readability.
4. Correct and render again until the picture is faithful and clean.
5. If rendering or visual inspection is unavailable, validate syntax and semantics as far as possible and label the output as unverified source. Never promise pixel-level correctness without looking at the rendered artifact.

## Present or embed

Match the destination rather than assuming one application:

- In a chat that renders Mermaid, include the fenced Mermaid block directly.
- For a saved PNG or SVG, use a normal Markdown image link or the harness's attachment mechanism.
- Use an Obsidian wikilink such as `![[filename.png|500]]` only when the selected destination is actually an Obsidian vault.
- When a lesson note is configured, place the visual beside the explanation it supports. Otherwise present it in chat.

Introduce the picture in one sentence and let it carry the relationship. Do not repeat every element in prose.
