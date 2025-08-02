import {
	type Bot,
	type CompleteDesiredProperties,
	type DesiredPropertiesBehavior,
	type DiscordMessage,
	type EventHandlers,
	type GatewayIntents,
	type Transformers,
	createBot,
} from "@discordeno/bot";
import type { Logger } from "pino";
import loggers from "./constants/loggers.ts";
import type { BaseDesiredProperties } from "./utilities/types.ts";

class Connection<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> {
	readonly log: Logger;
	readonly bot: Bot<TDesiredProperties, TDesiredPropertiesBehavior>;

	constructor({
		log,
		token,
		userAgent,
		desiredProperties,
		intents,
		eventHandlers = {},
		cacheHandlers = {},
	}: {
		log: Logger;
		token: string;
		userAgent: string;
		desiredProperties: TDesiredProperties;
		intents: GatewayIntents;
		eventHandlers?: Partial<
			EventHandlers<CompleteDesiredProperties<NoInfer<TDesiredProperties>>, TDesiredPropertiesBehavior>
		>;
		cacheHandlers?: Partial<
			Transformers<
				CompleteDesiredProperties<NoInfer<TDesiredProperties>>,
				TDesiredPropertiesBehavior
			>["customizers"]
		>;
	}) {
		this.log = log.child({ name: "Connection" });
		this.bot = createBot<TDesiredProperties, TDesiredPropertiesBehavior>({
			token,
			intents,
			gateway: { cache: { requestMembers: { enabled: true } } },
			events: eventHandlers,
			transformers: { customizers: cacheHandlers },
			handlers: {
				// Discord sends updates when an image resolves in an embed.
				// We don't want that because that's noise that we'd otherwise have to account for.
				MESSAGE_UPDATE: async (bot, data) => {
					const message = data.d as DiscordMessage;
					if (!message.author) {
						return;
					}

					// The `shardId` is not necessary here.
					bot.events.messageUpdate?.(bot.transformers.message(bot, { message, shardId: 0 }));
				},
			},
			desiredProperties,
			loggerFactory: (name) => loggers.discordeno.child({ name: name.toLowerCase() }, { level: "debug" }),
		});

		this.bot.rest.createBaseHeaders = () => ({ "User-Agent": userAgent });
	}

	async open(): Promise<void> {
		this.log.info("Establishing connection with the Discord gateway...");

		await this.bot.start();

		this.log.info("A connection with the Discord gateway has been established.");
	}

	async close(): Promise<void> {
		this.log.info("Closing Discord gateway connection...");

		await this.bot.shutdown();

		this.log.info("The connection with the Discord gateway has been closed.");
	}
}

export { Connection };
