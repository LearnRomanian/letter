import {
	ChannelTypes,
	type DesiredPropertiesBehavior,
	InteractionTypes,
	type Camelize,
	type Channel,
	type DiscordChannel,
	type DiscordGuild,
	type DiscordMember,
	type DiscordMessage,
	type DiscordRole,
	type DiscordUser,
	type Guild,
	type Interaction,
	type Member,
	type Message,
	type Role,
	type User,
} from "@discordeno/bot";
import type { Client } from "./client.ts";
import { code } from "./utilities/formatting.ts";
import type { BaseDesiredProperties, Letter } from "./utilities/types.ts";

type ID = bigint | string;
type IndexOr<T> = T | ID;

function isId<T>(object: IndexOr<T>): object is bigint | string {
	return typeof object === "bigint" || typeof object === "string";
}

type UserLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<User, TDesiredProperties, TDesiredPropertiesBehavior> | User | Camelize<DiscordUser>;
type MemberLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<Member, TDesiredProperties, TDesiredPropertiesBehavior> | Member | Camelize<DiscordMember>;
type RoleLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<Role, TDesiredProperties, TDesiredPropertiesBehavior> | Role | Camelize<DiscordRole>;
type GuildLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<Guild, TDesiredProperties, TDesiredPropertiesBehavior> | Guild | Camelize<DiscordGuild>;
type MessageLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<Message, TDesiredProperties, TDesiredPropertiesBehavior> | Message | Camelize<DiscordMessage>;
type ChannelLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<Channel, TDesiredProperties, TDesiredPropertiesBehavior> | Channel | Camelize<DiscordChannel>;
type InteractionLike<
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = Letter<Interaction, TDesiredProperties, TDesiredPropertiesBehavior> | Interaction;

class Diagnostics<
	TClient extends Client<any, any, any>,
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> {
	readonly #client: TClient;

	constructor(client: TClient) {
		this.#client = client;
	}

	user(
		userOrId: IndexOr<UserLike<TDesiredProperties, TDesiredPropertiesBehavior>>,
		options?: { prettify?: boolean },
	): string {
		let user: UserLike<TDesiredProperties, TDesiredPropertiesBehavior>;
		if (isId(userOrId)) {
			if (!this.#client.entities.users.has(BigInt(userOrId))) {
				return `uncached user (ID ${userOrId})`;
			}

			user = this.#client.entities.users.get(BigInt(userOrId))!;
		} else {
			user = userOrId;
		}

		const tag = user.discriminator === "0" ? user.username : `${user.username}#${user.discriminator}`;

		if (options?.prettify) {
			return `${tag} · ID ${user.id}`;
		}

		return `${tag} (ID ${user.id})`;
	}

	member(member: MemberLike<TDesiredProperties, TDesiredPropertiesBehavior>): string {
		let userFormatted: string;
		if (member.user !== undefined) {
			userFormatted = this.user(member.user);
		} else if ("id" in member) {
			userFormatted = this.user(member.id);
		} else {
			userFormatted = "unknown user";
		}

		let guildFormatted: string;
		if ("guildId" in member && member.guildId !== undefined) {
			guildFormatted = this.guild(member.guildId);
		} else {
			guildFormatted = "unknown guild";
		}

		return `${userFormatted} @ ${guildFormatted}`;
	}

	role(roleOrId: IndexOr<RoleLike<TDesiredProperties, TDesiredPropertiesBehavior>>): string {
		let role: RoleLike<TDesiredProperties, TDesiredPropertiesBehavior>;
		if (isId(roleOrId)) {
			if (!this.#client.entities.roles.has(BigInt(roleOrId))) {
				return `uncached role (ID ${roleOrId})`;
			}

			role = this.#client.entities.roles.get(BigInt(roleOrId))!;
		} else {
			role = roleOrId;
		}

		return `role '${role.name}' (ID ${role.id})`;
	}

	guild(guildOrId: IndexOr<GuildLike<TDesiredProperties, TDesiredPropertiesBehavior>>): string {
		let guild: GuildLike<TDesiredProperties, TDesiredPropertiesBehavior>;
		if (isId(guildOrId)) {
			if (!this.#client.entities.guilds.has(BigInt(guildOrId))) {
				return `uncached guild (ID ${guildOrId})`;
			}

			guild = this.#client.entities.guilds.get(BigInt(guildOrId))!;
		} else {
			guild = guildOrId;
		}

		return `guild '${guild.name}' (ID ${guild.id})`;
	}

	message(messageOrId: IndexOr<MessageLike<TDesiredProperties, TDesiredPropertiesBehavior>>): string {
		let message: MessageLike<TDesiredProperties, TDesiredPropertiesBehavior>;
		if (isId(messageOrId)) {
			if (!this.#client.entities.messages.latest.has(BigInt(messageOrId))) {
				return `uncached guild (ID ${messageOrId})`;
			}

			message = this.#client.entities.messages.latest.get(BigInt(messageOrId))!;
		} else {
			message = messageOrId;
		}

		const contentLength = message.content?.length ?? 0;
		const embedCount = message.embeds?.length ?? 0;
		const userFormatted = this.user(message.author.id);

		return `message of length ${contentLength} with ${embedCount} embeds (ID ${message.id}) posted by ${userFormatted}`;
	}

	channel(channelOrId: IndexOr<ChannelLike<TDesiredProperties, TDesiredPropertiesBehavior>>): string {
		let channel: ChannelLike<TDesiredProperties, TDesiredPropertiesBehavior>;
		if (isId(channelOrId)) {
			if (!this.#client.entities.channels.has(BigInt(channelOrId))) {
				return `uncached channel (ID ${channelOrId})`;
			}

			channel = this.#client.entities.channels.get(BigInt(channelOrId))!;
		} else {
			channel = channelOrId;
		}

		let guildFormatted: string;
		if (channel.guildId !== undefined) {
			guildFormatted = this.guild(channel.guildId);
		} else {
			guildFormatted = "unknown guild";
		}

		let channelTypeFormatted: string;
		switch (channel.type) {
			case ChannelTypes.GuildText: {
				channelTypeFormatted = "text channel";
				break;
			}
			case ChannelTypes.DM: {
				channelTypeFormatted = "DM channel";
				break;
			}
			case ChannelTypes.GroupDm: {
				channelTypeFormatted = "group DM channel";
				break;
			}
			case ChannelTypes.GuildVoice: {
				channelTypeFormatted = "voice channel";
				break;
			}
			case ChannelTypes.GuildStageVoice: {
				channelTypeFormatted = "stage channel";
				break;
			}
			case ChannelTypes.GuildAnnouncement: {
				channelTypeFormatted = "guild announcement";
				break;
			}
			case ChannelTypes.AnnouncementThread: {
				channelTypeFormatted = "announcement thread";
				break;
			}
			case ChannelTypes.PublicThread: {
				channelTypeFormatted = "public thread";
				break;
			}
			case ChannelTypes.PrivateThread: {
				channelTypeFormatted = "private thread";
				break;
			}
			default: {
				channelTypeFormatted = `unknown channel type (ID ${channel.type})`;
				break;
			}
		}

		if (channel.name === undefined) {
			return `unnamed ${channelTypeFormatted} (ID ${channel.id}) @ ${guildFormatted}`;
		}

		return `${channelTypeFormatted} '${channel.name}' (ID ${channel.id}) @ ${guildFormatted}`;
	}

	interaction(interaction: InteractionLike): string {
		let memberFormatted: string;
		if (interaction.member !== undefined) {
			memberFormatted = this.member(interaction.member);
		} else {
			memberFormatted = "unknown member";
		}

		let interactionTypeFormatted: string;
		switch (interaction.type) {
			case InteractionTypes.Ping: {
				interactionTypeFormatted = "ping interaction";
				break;
			}
			case InteractionTypes.ApplicationCommand: {
				if ("commandName" in interaction) {
					interactionTypeFormatted = `command interaction (${code(interaction.commandName)})`;
				} else {
					interactionTypeFormatted = "command interaction (unknown command)";
				}
				break;
			}
			case InteractionTypes.MessageComponent: {
				const customId = interaction.data?.customId;
				if (customId !== undefined) {
					interactionTypeFormatted = `component interaction (${code(customId)}})`;
				} else {
					interactionTypeFormatted = "component interaction (unknown custom ID)";
				}
				break;
			}
			case InteractionTypes.ApplicationCommandAutocomplete: {
				if ("commandName" in interaction) {
					interactionTypeFormatted = `autocomplete interaction (${code(interaction.commandName)})`;
				} else {
					interactionTypeFormatted = "autocomplete interaction (unknown command)";
				}
				break;
			}
			case InteractionTypes.ModalSubmit: {
				interactionTypeFormatted = "modal interaction";
				break;
			}
			default: {
				interactionTypeFormatted = `unknown interaction type (ID ${interaction.type})`;
				break;
			}
		}

		return `${interactionTypeFormatted} (ID ${interaction.id}) from ${memberFormatted}`;
	}
}

export { Diagnostics };
