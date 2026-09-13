---
name: teach
description: Teach a user so the subject is understood from foundations rather than merely memorized. Use for explanations, guided lessons, knowledge probes, or practice in any agent harness; adapt to the interaction, research, delegation, and note-taking capabilities actually available.
---

# Teaching

Two principles. Apply them to any explanation, from a one-liner to a deep dive.

The goal is never "the learner can recite the fact." The goal is **understanding**: the fact is derivable from foundations the learner already accepts, connected into their mental model, and therefore self-preserving. Memorized facts rot. Understood facts don't.

## Harness portability

This skill is capability-based. Never assume a particular agent runtime, tool name, directory layout, UI, model provider, or note application.

At the start of a teaching task, silently map the available capabilities:

- **User interaction:** use a structured question or choice tool when one exists; otherwise ask one concise question in chat and wait for the answer.
- **Graded checks:** use an interactive quiz tool when one exists; otherwise present the question and balanced options in chat, wait, then grade and explain in the next turn.
- **Research:** use the harness's search or browsing tools. Delegate to a research subagent only when delegation exists and is appropriate; otherwise research directly.
- **Visuals:** invoke the `visualize` skill when available. Otherwise emit a small Mermaid block for structural diagrams or create an SVG/image with whatever native tools are available.
- **Lesson notes:** persist polished lesson content only when the user has linked, selected, or requested a destination and the harness can write to it. Otherwise keep the lesson in chat. A missing optional capability must never block teaching.

Tool names exposed by a host environment are implementations, not requirements. Follow the current harness's authorization and interaction rules.

## The philosophy (why this works — internalize it)

Two brains can hold the same propositions and look identical from the outside (same answers to the same questions). But one holds a pile of **disconnected lone facts** (A). The other holds a few **core truths** from which all those facts are derivable (B), so to it the facts are obviously connected. That connection *is* understanding.

- Connected knowledge > disconnected knowledge
- A graph of dependencies > disjoint lonely nodes
- Understanding > memorizing

Understanding preserves knowledge (it's held in place by its connections), compresses it, and is just plain better. Every teaching move below exists to build that dependency graph in the learner's head: **nodes** (Principle i) and **edges** (Principle ii).

The felt goal is **the click**: the moment a pile of lonely facts collapses (compresses) into a few generating ideas — same information, far fewer moving parts. When teaching lands, that collapse is what it feels like from the inside; aim for it.

A key mechanism: **the brain won't fully commit to a fact it isn't sure is safe to lock in.** If something more fundamental might later contradict it, committing is risky — it'd force an expensive update. So the brain hedges, and the fact never really lands. Both principles below remove that risk in different ways.

## Principle i — Unconditional truths first

Start from the ground. Lock in the core, **always-true** unconditional truths before anything built on top of them.

Why start here? **Not** because bottom-up is the logically "correct" order — because unconditional truths are simply the *easiest* thing for the brain to accept and lock in. They're safe, so they commit instantly, and they give the first solid ground to stand on and build from. Especially valuable when the subject is entirely new and there's little to connect to yet.

**Terminology — keep these distinct, and don't overuse "axiom."** An *unconditional truth* is a fact the learner can accept **as-is, at face value, with no caveats or nuance** — that's a property of *how the fact is held*. An *axiom* is a fact that **follows from nothing else** — a property of *where it sits in the graph* (a root node with no incoming edges). They overlap but are not synonyms: an axiom that's also caveat-free is one kind of unconditional truth, but plenty of unconditional truths *do* derive from deeper things — they simply don't need that derivation to be safely accepted. Default to saying **"unconditional truth"**; reserve **"axiom"** for facts that genuinely bottom out. Don't call something an axiom just because it sounds foundational.

- Find the few hard facts the learner can take at face value — often first principles that don't depend on anything else, though they needn't be true roots. There may be very few. That's fine; small and solid beats large and shaky.
- They must be simple enough to be accepted **as-is, without nuance or caveats**. No "well, usually…". If it needs conditions, it's not an unconditional truth yet — dig down further.
- These can be committed to *instantly and safely*, because nothing more fundamental will come along to contradict them. That safety is what makes them lock in.
- Build everything else up from these, explicitly, so the learner can see each new fact resting on the foundation.

**Confirm the foundation before building on it.** Briefly check that each core truth actually reads as obviously/unconditionally true to the learner before you add structure on top. If a core truth doesn't feel rock-solid, stop and fix the foundation — don't build on sand.

**Two especially strong forms of unconditional truth to reach for:**
- **Universal statements** — *"all X are Y"* or *"no X is Y"*. These are easy for the brain to lock in because they admit no exceptions to hedge against. A clean atomic-unit version (*"ALL X is done through {____}"*, e.g. *"ALL communication between computers is done through {sending packets}"*) is one particularly strong special case — surface it when a domain has one, but it's just one shape of universal statement, not the only one.
- **Real definitions** — a genuine definition is a great place to start. But only if it's an *actual* definition, not a vague list of properties dressed up as one. If it's just "things that tend to be true of X," it isn't a definition and won't anchor anything.

Don't force either where there isn't a clean one.

## Principle ii — "How could I have discovered this?"

Facts feel arbitrary when there's no visible reason they *had* to be this way. "Why does it need to be like this? Feels arbitrary." The brain won't commit to arbitrary-feeling info. The fix: make it feel discovered, not decreed.

Walk the learner through how they **could have discovered the thing themselves**. Every step must be *motivated*:

- Start from square one: **why are we even doing this?** What core problem sends us down this path?
- Motivate every intermediate step too: why try *this* formula? why manipulate the equation *this* way? What could have led someone to this approach in the first place?
- The output is turning **disconnected propositions → connected propositions** — adding the edges to the graph.

3Blue1Brown (Grant Sanderson) is the master reference for this. Aim for that: nothing appears from nowhere; every move feels like something the learner might have reached for themselves.

### Socratic vs expository — adaptive

Choose per topic and the learner's apparent energy:
- **Socratic** — pose the motivating problem and let the learner attempt the discovery before you reveal. More effortful, stronger locking-in. Default to this when they can plausibly reason their way there. If the prompt has a definite right answer, use the available graded-check capability; reserve open questions for genuine no-right-answer forks such as preferences or direction.
- **Expository** — narrate the motivated discovery path (3B1B style), with no back-and-forth needed. Use when the topic is beyond cold-reasoning reach, or when the learner is low-energy or wants it delivered.

When unsure, lean Socratic for things the learner can clearly reason about; otherwise narrate.

## The process: probe → plan → teach

The two principles are *how* you teach. This is *when* — the shape of a teaching session. Run all three phases in order, every time; scale each phase's *size* to the topic, never its *shape*.

**Accuracy is non-negotiable — verify, don't wing it from memory.** The learner has to be able to trust the teacher; one confidently delivered hallucination poisons that. The moment you are meaningfully unsure of a fact, name, date, formula, definition, or claim, verify it with the best available primary or authoritative source before teaching it. Use a research subagent when the harness supports one; otherwise use search/browsing directly. If neither exists, state the uncertainty and avoid presenting the claim as foundational. If a check corrects what you were about to teach, say so plainly. A wrong unconditional truth or a wrong "discovered" step corrupts every node built on top of it.

### Writing graded-check options

The tool already tells you to keep options even. That rule isn't enough on its own because it's a *post-hoc audit* — you write a good answer plus some throwaway wrongs, then don't re-scrutinise them. The tell is baked in before any check runs. So don't audit afterwards; **build the options so evenness is automatic**:

1. **Every option is a bare claim — no justification anywhere.** The number-one giveaway is the correct option carrying its own reasoning ("…, because it preserves X") while the distractors are bare, making it longer and more specific. Put *zero* "why" in any option; give the reasoning only after the learner answers.
2. **Write the correct claim first, then mutate it into each distractor.** Take one specific misconception or easily-confused neighbour and state what someone holding it would claim — in the *same* skeleton, grain size, and register as the correct claim. Now every option is "the claim under some belief," and the correct one is just the claim under the *correct* belief. Parallelism falls out by construction instead of being policed.
3. Each distractor must still be a real error the learner might actually make (so the choice is diagnostic), yet unambiguously wrong on the intended reading — tempting, not tricky.
4. **No asymmetric bolding.** Don't bold the key concept in one option and not the others — highlighting the term you're testing only in the correct answer flags it instantly. Either bold nothing, or bold the parallel term in every option.

If, reading the finished set cold, you can still tell which is right without knowing the material, you skipped step 1 or 2 — regenerate, don't patch.

### Phase 1 — Probe (never skip this)

You can't teach into the learner's zone of proximal development without knowing where its edges are, and you can't aim the teaching without knowing what they are actually reaching for. Keep two separate unknowns clear:

**1a. Current level — use graded checks. This is a mapping job, not a spot-check.** Your goal is to locate the *edge* of the learner's understanding — the frontier where what they reliably know turns into what they don't — along every strand the planned lesson will depend on. Use a quiz tool if available; otherwise ask and grade in chat. Until you've actually found that edge, you cannot teach into it, so this phase gets as long and detailed as it needs to be. Scale the depth to the user's request: a quick explanation may need only a compact probe, while a course-sized goal may need a detailed one.

**The edge is only located when it's bracketed.** For each relevant strand you need *both*: something at that level the learner gets **right** (a floor — proof they know at least this much) and something they get **wrong** or genuinely don't know (a ceiling — where it runs out). The edge sits between them. One side alone tells you almost nothing.

- **All-correct is not "done" — it means the questions were too easy.** A run of right answers gives you a floor with no ceiling: you've proven the learner knows *at least* this much and learned nothing about where their knowledge ends. Escalate sharply until something breaks, unless the user asked for only a brief explanation and further probing would be disproportionate.
- **Binary-search the edge.** When the learner nails a question, jump the difficulty up sharply. When they miss, you've bracketed the edge from above; narrow back in to locate it efficiently.
- **One wrong answer is not "done" either — and it is *not* a cue to start teaching.** A single miss is one coordinate, and you don't yet know its kind: a careless slip, a narrow isolated gap, or a systematic misconception. Probe *around* it to characterize it before concluding anything. Misconceptions matter most — a confidently-held wrong model has to be dislodged, not merely topped up — so when you catch one, dig into its extent rather than moving on.
- **Map every strand the lesson rests on.** A topic has several prerequisite threads, and the edge is a frontier across all of them, not a single point. Probe each thread the explanation will lean on and find where each one runs out. Bound this by *relevance to the goal*: map every corner the teaching will depend on, and don't bother with corners it won't.

Do not advance to Phase 2 until, for each goal-relevant strand, you can state concretely both what the learner knows and where it ends. Handle nuance with small graded questions adapted to prior answers, not one giant caveated question. The check must have a known answer and explanation so you learn where the learner goes wrong, not just that they did.

**1b. Learning goal — use an open question.** Find out what the learner actually wants taught. With an unfamiliar subject, the goal may be hard to articulate — "I want to understand LLMs" or "how the internet works" can mean many different things. Use a structured input tool if available; otherwise ask in chat. This is a preference or scope question, not a graded check.

### Phase 2 — Plan (think hard here)

This is the highest-leverage step. With the learner's level and goal in hand, reason out the best way to teach *this thing* to *this person*. Re-read the philosophy above and plan against it:

- **Scope the field with available research capabilities.** Before planning the graph, verify the topic's core concepts, real first principles, standard framings, and common gotchas when the subject warrants external research. Delegate if supported; otherwise research directly. For stable, elementary material you know with high confidence, keep this proportional rather than forcing a web search.
- What are the unconditional truths this rests on? Is there a clean atomic unit ("ALL X is done through {____}")?
- Which truths does the learner already hold (from Phase 1a)? Build from there — not below it, not above it.
- What's the motivated discovery path from those truths to the learner's goal? Where does each step come from — why would anyone reach for it?
- Socratic or expository for each stretch, given the topic and the learner's energy?

A good plan is what makes the teaching feel inevitable instead of arbitrary.

**Then present the plan in chat — always, before any teaching.** Two parts:

1. **The approach, in prose.** What we'll cover, in what order, and why this way — given where the learner's edge sits (Phase 1a) and what they're reaching for (Phase 1b). A few freeform sentences.
2. **The dependency map.** The plan's backbone as a DAG: unconditional truths at the roots, each derived node hanging off what it depends on, and the learner's goal as the sink. Prefer a small Mermaid graph when the current interface renders it; otherwise use a compact indented dependency list. Keep it small: few nodes, short labels — a map, not the territory.

**Stress-test the roots before presenting.** For every node you're treating as foundational, ask: is this genuinely an unconditional truth *for the learner*, or a disguised theorem that itself derives from something simpler they'd accept at face value? If it derives, push it down and extend the map — never found the lesson on a mid-level fact. A wrong root corrupts everything hung off it.

**Then stop and wait for the learner's go-ahead.** The presented plan is their checkpoint: a wrong root or wrong scope is cheap to fix now, expensive mid-lesson. Do not begin Phase 3 until they approve the plan. For a one-answer explanation where a separate checkpoint would be disproportionate, present a compact plan and explanation together.

### Phase 3 — Teach (the loop)

Build the learner's dependency graph one **node** at a time — and give every node the same treatment, whether it's a foundational unconditional truth or a derived step. Most topics need several, and each new one goes through the loop:

For **every node** (each unconditional truth *and* each non-trivial reasoning step toward the goal), run:

1. **Motivate.** Frame why we need this node right now — what problem it solves or what gap it closes. This applies to unconditional truths too: don't just assert one because it's true, motivate why *this* truth, *now*. "Why are we even bringing this in?"
2. **Establish.** 
   - If it's a foundational unconditional truth: state it plainly, at face value, no caveats. Surface an atomic unit if one fits.
   - If it's a derived step: build it up from what's already established via a motivated move (Socratic or expository), answering "how could I have discovered this?" When a Socratic step has a gradable right/wrong answer, use the graded-check capability. Use an open question only when there genuinely is no right answer.
3. **Connect.** Make the dependency edge explicit — show exactly how this new node hangs off the ones already in place, so it's understood, not memorized.
4. **Check.** Confirm the node actually landed with a quick graded check — using a tool or ordinary chat. This applies to foundations just as much as derived steps. If the learner misses it, that node isn't solid, so stop and repair it before building on top of it.

Repeat this full loop per node — don't front-load all the foundations once at the start and then stop checking. Any time a new unconditional truth is needed mid-session, it goes through motivate → establish → connect → check just like a derived step would.

If you catch yourself asserting a fact the learner would have to take on faith — foundational or not — stop: either motivate it and confirm it lands, or ground it in something already established. Unmotivated, unconfirmed facts don't lock in — that's the whole point.

## Optional lesson-note hygiene

When a note destination is configured or requested, treat it as a **curated learning artifact, never a chat transcript**. This section is inactive when no writable destination exists.

Include only material that directly teaches or practices the subject:

- definitions, explanations, derivations, examples, dependency maps, and summaries
- graded subject-matter questions, the learner's answers, and instructional feedback
- learner questions whose substance is part of the topic being learned

Exclude all non-content conversation:

- setup, tool loading, file paths, logging instructions, and configuration
- UI/display bugs, troubleshooting, and format negotiations
- confirmations, acknowledgements, cancellations, and “continue/ready” exchanges
- goal/scope negotiation and other process chatter once its useful conclusion has been incorporated into the lesson plan

Use the harness's note tool when available. Otherwise, if the user has authorized a Markdown destination, use normal file-writing capabilities. Do not create or choose a destination without the user's intent. Write polished explanations, derivations, examples, dependency maps, and summaries; do not log ordinary chat. Never write setup, status, debugging, confirmations, cancellations, or process discussion. Record graded questions and feedback only when the note workflow supports it. Never preserve or summarize a learner note that explicitly says it should not be recorded.

## Formatting — math renders as LaTeX

When the destination supports Markdown math, use LaTeX in polished note content:

- Inline math: `$f(x)$`
- Centered display math: `$$` fenced on its own lines, e.g. `$$\n f(x) \n$$`

If LaTeX can be used, it should be. Write $f(x) = x^2$, not `f(x) = x^2`.

### Interactive-display compatibility

Adapt notation to the active interface. If it renders LaTeX reliably, use it. Otherwise, in visible chat and interactive questions use readable Unicode/plain-text notation such as `P(A | B)`, `×`, `÷`, and `3/10`; avoid raw commands such as `\\frac`, `\\mid`, and `\\cap`. When a note destination supports LaTeX but chat does not, write a polished LaTeX version to the note and a readable plain-text version in chat.
