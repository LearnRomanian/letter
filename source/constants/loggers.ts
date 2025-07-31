import pino from "pino";
import logTargets from "source/constants/log-targets";

export default Object.freeze({
	silent: pino({ level: "silent" }),
	feedback: pino(pino.transport(logTargets.stdout.feedback)),
	debug: pino(
		pino.transport<Record<string, unknown>>({
			targets: [logTargets.stdout.feedback, logTargets.file.debug],
		}),
	),
	standard: pino(pino.transport(logTargets.file.standard)),
	discordeno: pino(pino.transport(logTargets.file.discordeno)),
} as const);
