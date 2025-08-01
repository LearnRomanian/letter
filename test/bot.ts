import { Client } from "../index.ts";
import loggers from "../source/constants/loggers.ts";
import { loadEnvironment } from "../source/loaders/environment.ts";
import { createDesiredPropertiesObject, Intents } from "@discordeno/bot";

const logger = loggers.debug;

const client = new Client({
	environment: loadEnvironment({ log: logger, mapProperties: () => ({}) }),
	userAgent: "Letter Framework",
	desiredProperties: createDesiredPropertiesObject({}, true),
	intents:
		Intents.Guilds |
		Intents.GuildMembers |
		Intents.GuildModeration |
		Intents.GuildVoiceStates |
		Intents.GuildMessages |
		Intents.MessageContent,
	log: logger,
});

await client.start();

console.log("yay");

await client.stop();
