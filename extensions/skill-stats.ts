import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

type InvocationSource = "explicit" | "automatic";

interface UsageEvent {
	version: 1;
	timestamp: string;
	skill: string;
	source: InvocationSource;
	sessionId?: string;
}

interface SkillSummary {
	total: number;
	explicit: number;
	automatic: number;
	lastUsedAt: string;
}

const STATS_FILE = path.join(homedir(), ".pi", "agent", "skill-usage.jsonl");
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function optionPathSkillName(filePath: string): string | undefined {
	const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
	if (parts.at(-1) !== "SKILL.md" || parts.length < 2) return undefined;
	const name = parts.at(-2)?.toLowerCase();
	return name && SKILL_NAME.test(name) ? name : undefined;
}

function readEvents(): UsageEvent[] {
	if (!fs.existsSync(STATS_FILE)) return [];
	const events: UsageEvent[] = [];
	for (const line of fs.readFileSync(STATS_FILE, "utf8").split("\n")) {
		if (!line.trim()) continue;
		try {
			const event = JSON.parse(line) as Partial<UsageEvent>;
			if (
				event.version === 1 &&
				typeof event.timestamp === "string" &&
				typeof event.skill === "string" &&
				(event.source === "explicit" || event.source === "automatic")
			) {
				events.push(event as UsageEvent);
			}
		} catch {
			// Ignore a partial or malformed line instead of losing valid history.
		}
	}
	return events;
}

function summarize(events: UsageEvent[]): Map<string, SkillSummary> {
	const result = new Map<string, SkillSummary>();
	for (const event of events) {
		const current = result.get(event.skill) ?? {
			total: 0,
			explicit: 0,
			automatic: 0,
			lastUsedAt: event.timestamp,
		};
		current.total += 1;
		current[event.source] += 1;
		if (event.timestamp > current.lastUsedAt) current.lastUsedAt = event.timestamp;
		result.set(event.skill, current);
	}
	return result;
}

export default function skillStats(pi: ExtensionAPI) {
	let countedThisTurn = new Set<string>();
	let explicitPending = new Set<string>();

	function knownSkillNames(): Set<string> {
		const names = new Set<string>();
		for (const command of pi.getCommands()) {
			if (command.source !== "skill") continue;
			const fromPath = optionPathSkillName(command.sourceInfo.path);
			if (fromPath) names.add(fromPath);
			const fromCommand = command.name.replace(/^skill:/, "").replace(/:\d+$/, "").toLowerCase();
			if (SKILL_NAME.test(fromCommand)) names.add(fromCommand);
		}
		return names;
	}

	function record(skill: string, source: InvocationSource, ctx: any): void {
		const event: UsageEvent = {
			version: 1,
			timestamp: new Date().toISOString(),
			skill,
			source,
			sessionId: ctx.sessionManager?.getSessionId?.(),
		};
		fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
		fs.appendFileSync(STATS_FILE, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
	}

	pi.on("input", (event, ctx) => {
		explicitPending = new Set<string>();
		const match = event.text.trim().match(/^\/skill:([a-z0-9]+(?:-[a-z0-9]+)*)(?:\s|$)/i);
		if (!match) return;
		const skill = match[1].toLowerCase();
		if (!knownSkillNames().has(skill)) return;
		try {
			record(skill, "explicit", ctx);
			explicitPending.add(skill);
		} catch {
			// Usage tracking must never block the skill itself.
		}
	});

	pi.on("turn_start", () => {
		countedThisTurn = new Set(explicitPending);
		explicitPending.clear();
	});

	pi.on("tool_call", (event, ctx) => {
		if ((event as any).toolName !== "read") return;
		const filePath = (event as any).input?.path;
		if (typeof filePath !== "string") return;
		const skill = optionPathSkillName(filePath);
		if (!skill || !knownSkillNames().has(skill) || countedThisTurn.has(skill)) return;
		try {
			record(skill, "automatic", ctx);
			countedThisTurn.add(skill);
		} catch {
			// Usage tracking must never block the read that activates the skill.
		}
	});

	pi.registerCommand("skill-stats", {
		description: "Show persistent skill invocation counts",
		handler: async (args, ctx) => {
			try {
				const requested = args.trim().toLowerCase();
				const all = summarize(readEvents());
				const rows = [...all.entries()]
					.filter(([name]) => !requested || name === requested)
					.sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));

				if (rows.length === 0) {
					ctx.ui.notify(
						requested ? `No recorded calls for skill: ${requested}` : "No skill calls recorded yet.",
						"info",
					);
					return;
				}

				const lines = rows.map(([name, stats]) =>
					`${name}: ${stats.total} total (${stats.explicit} explicit, ${stats.automatic} automatic) · last ${new Date(stats.lastUsedAt).toLocaleString()}`,
				);
				ctx.ui.notify(lines.join("\n"), "info");
			} catch (error) {
				ctx.ui.notify(`Unable to read skill stats: ${(error as Error).message}`, "error");
			}
		},
	});
}
