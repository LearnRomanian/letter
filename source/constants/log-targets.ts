import directories from "./directories.ts";

export default Object.freeze({
	stdout: {
		feedback: {
			target: "pino-pretty",
			level: "debug",
			options: {
				ignore: "pid,hostname",
			},
		},
	},
	file: {
		debug: {
			target: "pino/file",
			level: "debug",
			options: { destination: `${directories.logs}/log.txt`, mkdir: true },
		},
		standard: {
			target: "pino/file",
			level: "info",
			options: { destination: `${directories.logs}/log.txt`, mkdir: true },
		},
		discordeno: {
			target: "pino/file",
			level: "debug",
			options: {
				destination: `${directories.logs}/discordeno.txt`,
				mkdir: true,
			},
		},
	},
} as const);
