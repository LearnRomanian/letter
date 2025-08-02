import type pino from "pino";
// import type { EntryRequest } from "rost/models/entry-request";
// import type { Guild } from "rost/models/guild";
// import type { Model } from "rost/models/model";
// import type { Praise } from "rost/models/praise";
// import type { Report } from "rost/models/report";
// import type { Resource } from "rost/models/resource";
// import type { Suggestion } from "rost/models/suggestion";
// import type { Ticket } from "rost/models/ticket";
// import type { User } from "rost/models/user";
// import type { Warning } from "rost/models/warning";
import type { BaseDesiredProperties, Letter } from "./utilities/types.ts";
import {
	Collection,
	type VoiceState,
	type Attachment,
	type Channel,
	type DesiredPropertiesBehavior,
	type Guild,
	type Member,
	type Message,
	type Role,
	type Transformers,
	type User,
	type Bot,
} from "@discordeno/bot";

class Cache<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> {
	readonly log: pino.Logger;
	readonly entities: {
		readonly guilds: Map<bigint, Letter<Guild, TDesiredProperties, TDesiredPropertiesBehavior>>;
		readonly users: Map<bigint, Letter<User, TDesiredProperties, TDesiredPropertiesBehavior>>;
		readonly members: Map<
			/* guildId: */ bigint,
			Map</* userId: */ bigint, Letter<Member, TDesiredProperties, TDesiredPropertiesBehavior>>
		>;
		readonly channels: Map<bigint, Letter<Channel, TDesiredProperties, TDesiredPropertiesBehavior>>;
		readonly messages: {
			readonly latest: Map<bigint, Letter<Message, TDesiredProperties, TDesiredPropertiesBehavior>>;
			readonly previous: Map<bigint, Letter<Message, TDesiredProperties, TDesiredPropertiesBehavior>>;
		};
		readonly attachments: Map<bigint, Letter<Attachment, TDesiredProperties, TDesiredPropertiesBehavior>>;
		readonly roles: Map<bigint, Letter<Role, TDesiredProperties, TDesiredPropertiesBehavior>>;
	};
	// readonly documents: {
	// 	readonly entryRequests: Map<string, EntryRequest>;
	// 	readonly guilds: Map<string, Guild>;
	// 	readonly praisesByAuthor: Map<string, Map<string, Praise>>;
	// 	readonly praisesByTarget: Map<string, Map<string, Praise>>;
	// 	readonly reports: Map<string, Report>;
	// 	readonly resources: Map<string, Resource>;
	// 	readonly suggestions: Map<string, Suggestion>;
	// 	readonly tickets: Map<string, Ticket>;
	// 	readonly users: Map<string, User>;
	// 	readonly warningsByTarget: Map<string, Map<string, Warning>>;
	// };

	readonly #fetchRequests: Set<bigint>;

	constructor({ log }: { log: pino.Logger }) {
		this.log = log.child({ name: "CacheStore" });
		this.entities = {
			guilds: new Map(),
			users: new Map(),
			members: new Map(),
			channels: new Map(),
			messages: {
				latest: new Map(),
				previous: new Map(),
			},
			attachments: new Map(),
			roles: new Map(),
		};
		// this.documents = {
		// 	entryRequests: new Map(),
		// 	guilds: new Map(),
		// 	praisesByAuthor: new Map(),
		// 	praisesByTarget: new Map(),
		// 	reports: new Map(),
		// 	resources: new Map(),
		// 	suggestions: new Map(),
		// 	tickets: new Map(),
		// 	users: new Map(),
		// 	warningsByTarget: new Map(),
		// };

		this.#fetchRequests = new Set();
	}

	buildCacheHandlers(): Partial<Transformers<TDesiredProperties, TDesiredPropertiesBehavior>["customizers"]> {
		return {
			guild: this.#cacheEntity(this.#cacheGuild.bind(this)),
			channel: this.#cacheEntity(this.#cacheChannel.bind(this)),
			user: this.#cacheEntity(this.#cacheUser.bind(this)),
			member: this.#cacheEntity(this.#cacheMember.bind(this)),
			message: this.#cacheEntity(this.#cacheMessage.bind(this)),
			attachment: this.#cacheEntity(this.#cacheAttachment.bind(this)),
			role: this.#cacheEntity(this.#cacheRole.bind(this)),
			voiceState: this.#cacheEntity(this.#cacheVoiceState.bind(this)),
		};
	}

	#cacheEntity<T>(
		callback: (entity: T) => Promise<void>,
	): (bot: Bot<TDesiredProperties, TDesiredPropertiesBehavior>, payload: unknown, entity: T) => T {
		return (_, __, entity) => {
			callback(entity);
			return entity;
		};
	}

	async #cacheGuild(guild_: Letter<Guild, TDesiredProperties, TDesiredPropertiesBehavior>): Promise<void> {
		const oldGuild = this.entities.guilds.get(guild_.id);
		const guild = {
			...(guild_ as unknown as Letter<Guild, TDesiredProperties, TDesiredPropertiesBehavior>),
			roles: new Collection([...(oldGuild?.roles ?? []), ...(guild_.roles ?? [])]),
			emojis: new Collection([...(oldGuild?.emojis ?? []), ...(guild_.emojis ?? [])]),
			voiceStates: new Collection([...(oldGuild?.voiceStates ?? []), ...(guild_.voiceStates ?? [])]),
			members: new Collection([...(oldGuild?.members ?? []), ...(guild_.members ?? [])]),
			channels: new Collection([...(oldGuild?.channels ?? []), ...(guild_.channels ?? [])]),
			threads: new Collection([...(oldGuild?.threads ?? []), ...(guild_.threads ?? [])]),
			memberCount: oldGuild?.memberCount ?? 0,
		};

		this.entities.guilds.set(guild.id, guild);

		for (const channel of guild.channels?.array() ?? []) {
			this.#cacheChannel(channel);
		}
	}

	async #cacheChannel(channel: Letter<Channel, TDesiredProperties, TDesiredPropertiesBehavior>): Promise<void> {
		this.entities.channels.set(channel.id, channel);

		if (channel.guildId !== undefined) {
			this.entities.guilds.get(channel.guildId)?.channels?.set(channel.id, channel);
		}
	}

	async #cacheUser(user: Letter<User, TDesiredProperties, TDesiredPropertiesBehavior>): Promise<void> {
		this.entities.users.set(user.id, user);
	}

	async #cacheMember(member: Letter<Member, TDesiredProperties, TDesiredPropertiesBehavior>): Promise<void> {
		if (member.guildId === undefined) {
			return;
		}

		if (this.entities.members.has(member.guildId)) {
			this.entities.members.get(member.guildId)!.set(member.id, member);
		} else {
			this.entities.members.set(member.guildId, new Map([[member.id, member]]));
		}

		this.entities.guilds.get(member.guildId)?.members?.set(member.id, member);
	}

	async #cacheMessage(message: Letter<Message, TDesiredProperties, TDesiredPropertiesBehavior>): Promise<void> {
		const previousMessage = this.entities.messages.latest.get(message.id);
		if (previousMessage !== undefined) {
			this.entities.messages.previous.set(message.id, previousMessage);
		}

		this.entities.messages.latest.set(message.id, message);
	}

	async #cacheAttachment(
		attachment: Letter<Attachment, TDesiredProperties, TDesiredPropertiesBehavior>,
	): Promise<void> {
		if (this.entities.attachments.has(attachment.id) || this.#fetchRequests.has(attachment.id)) {
			return;
		}

		this.#fetchRequests.add(attachment.id);

		const blob = await fetch(attachment.url).then((response) => response.blob());

		this.entities.attachments.set(
			attachment.id,
			// @ts-ignore: Discordeno expects the Node `Blob`, while we can only provide a bun `Blob`.
			Object.assign(attachment, { name: attachment.filename, blob }),
		);

		this.#fetchRequests.delete(attachment.id);
	}

	async #cacheRole(role: Letter<Role, TDesiredProperties, TDesiredPropertiesBehavior>): Promise<void> {
		this.entities.roles.set(role.id, role);

		this.entities.guilds.get(role.guildId)?.roles?.set(role.id, role);
	}

	async #cacheVoiceState(
		voiceState: Letter<VoiceState, TDesiredProperties, TDesiredPropertiesBehavior>,
	): Promise<void> {
		if (voiceState.channelId !== undefined) {
			this.entities.guilds.get(voiceState.guildId)?.voiceStates?.set(voiceState.userId, voiceState);
		} else {
			this.entities.guilds.get(voiceState.guildId)?.voiceStates?.delete(voiceState.userId);
		}
	}

	// cacheDocuments<M extends Model>(documents: M[]): void {
	// 	if (documents.length === 0) {
	// 		return;
	// 	}

	// 	this.log.debug(`Caching ${documents.length} documents...`);

	// 	for (const document of documents) {
	// 		this.cacheDocument(document);
	// 	}
	// }

	// cacheDocument(document: any): void {
	// 	switch (document.collection as Collection) {
	// 		case "DatabaseMetadata": {
	// 			// Uncached
	// 			break;
	// 		}
	// 		case "EntryRequests": {
	// 			this.documents.entryRequests.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Guilds": {
	// 			this.documents.guilds.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Praises": {
	// 			if (this.documents.praisesByAuthor.has(document.authorId)) {
	// 				this.documents.praisesByAuthor.get(document.authorId)?.set(document.partialId, document);
	// 			} else {
	// 				this.documents.praisesByAuthor.set(document.authorId, new Map([[document.partialId, document]]));
	// 			}

	// 			if (this.documents.praisesByTarget.has(document.targetId)) {
	// 				this.documents.praisesByTarget.get(document.targetId)?.set(document.partialId, document);
	// 			} else {
	// 				this.documents.praisesByTarget.set(document.targetId, new Map([[document.partialId, document]]));
	// 			}

	// 			break;
	// 		}
	// 		case "Reports": {
	// 			this.documents.reports.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Resources": {
	// 			this.documents.resources.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Suggestions": {
	// 			this.documents.suggestions.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Tickets": {
	// 			this.documents.tickets.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Users": {
	// 			this.documents.users.set(document.partialId, document);
	// 			break;
	// 		}
	// 		case "Warnings": {
	// 			if (this.documents.warningsByTarget.has(document.targetId)) {
	// 				this.documents.warningsByTarget.get(document.targetId)?.set(document.partialId, document);
	// 			} else {
	// 				this.documents.warningsByTarget.set(document.targetId, new Map([[document.partialId, document]]));
	// 			}
	// 			break;
	// 		}
	// 	}
	// }

	// unloadDocument(document: any): void {
	// 	switch (document.collection as Collection) {
	// 		case "DatabaseMetadata": {
	// 			// Uncached
	// 			break;
	// 		}
	// 		case "EntryRequests": {
	// 			this.documents.entryRequests.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Guilds": {
	// 			this.documents.guilds.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Praises": {
	// 			if (this.documents.praisesByAuthor.has(document.authorId)) {
	// 				this.documents.praisesByAuthor.get(document.authorId)?.delete(document.partialId);
	// 			}

	// 			if (this.documents.praisesByTarget.has(document.targetId)) {
	// 				this.documents.praisesByTarget.get(document.targetId)?.delete(document.partialId);
	// 			}

	// 			break;
	// 		}
	// 		case "Reports": {
	// 			this.documents.reports.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Resources": {
	// 			this.documents.resources.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Suggestions": {
	// 			this.documents.suggestions.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Tickets": {
	// 			this.documents.tickets.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Users": {
	// 			this.documents.users.delete(document.partialId);
	// 			break;
	// 		}
	// 		case "Warnings": {
	// 			if (this.documents.warningsByTarget.has(document.targetId)) {
	// 				this.documents.warningsByTarget.get(document.targetId)?.delete(document.partialId);
	// 			}
	// 			break;
	// 		}
	// 	}
	// }
}

export { Cache };
