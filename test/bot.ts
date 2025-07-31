import { Intents, createDesiredPropertiesObject } from "@discordeno/bot";
import loggers from "source/constants/loggers";
import { Client } from "source/library/client";
import { loadEnvironment } from "source/loaders/environment";

const logger = process.env.IS_DEBUG === "true" ? loggers.debug : loggers.standard;

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
	log: loggers.standard,
});

await client.start();

await client.stop();
