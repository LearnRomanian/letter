import type pino from "pino";
import type { Message } from "@discordeno/bot";
import type { Client } from "./client.ts";

abstract class Service<TClient extends Client<any, any, any>> {
	readonly identifier: string;
	readonly log: pino.Logger;
	readonly client: TClient;

	constructor(client: TClient, { identifier }: { identifier: string }) {
		this.identifier = identifier;
		this.log = client.log.child({ name: identifier });
		this.client = client;
	}

	abstract start(): Promise<void>;

	abstract stop(): Promise<void>;
}

abstract class GlobalService<TClient extends Client<any, any, any>> extends Service<TClient> {
	async start(): Promise<void> {
		// Do nothing.
	}

	async stop(): Promise<void> {
		// Do nothing.
	}
}

abstract class LocalService<TClient extends Client<any, any, any>> extends Service<TClient> {
	readonly guildId: bigint;
	readonly guildIdString: string;

	get guild(): Rost.Guild {
		return this.client.entities.guilds.get(this.guildId)!;
	}

	get guildDocument(): Guild {
		return this.client.documents.guilds.get(this.guildIdString)!;
	}

	constructor(client: TClient, { identifier, guildId }: { identifier: string; guildId: bigint }) {
		super(client, { identifier });

		this.guildId = guildId;
		this.guildIdString = guildId.toString();
	}

	async start(): Promise<void> {
		// Do nothing.
	}

	async stop(): Promise<void> {
		// Do nothing.
	}

	async getAllMessages({ channelId }: { channelId: bigint }): Promise<Message[] | undefined> {
		const buffer: Message[] = [];

		let isFinished = false;
		while (!isFinished) {
			const chunk = await this.client.bot.helpers
				.getMessages(channelId, {
					limit: 100,
					before: buffer.length === 0 ? undefined : buffer.at(-1)?.id,
				})
				.catch((error: any) => {
					this.client.log.warn(
						error,
						`Failed to get all messages from ${this.client.diagnostics.channel(channelId)}.`,
					);
					return undefined;
				});
			if (chunk === undefined) {
				return undefined;
			}

			if (chunk.length < 100) {
				isFinished = true;
			}

			buffer.push(...chunk);
		}

		return buffer;
	}
}

class ServiceStore<
	TClient extends Client<any, any, any>,
	GlobalServices extends Record<string, GlobalService<TClient>>,
	LocalServices extends Record<string, LocalService<TClient>>,
> {
	readonly log: pino.Logger;

	readonly #client: TClient;
	readonly #global: GlobalServices;
	readonly #local: { [K in keyof LocalServices]: Map<bigint, LocalServices[K]> };

	get #globalServices(): GlobalService<TClient>[] {
		return [...Object.values(this.#global)];
	}

	get #localServices(): LocalService<TClient>[] {
		return [...Object.values(this.#local)].flatMap((services) => [...services.values()]);
	}

	constructor(client: TClient, services: { global: GlobalServices; local: [keyof LocalServices] }) {
		this.log = client.log.child({ name: "Services" });

		this.#client = client;
		this.#global = services.global;
		this.#local = Object.fromEntries(Array.from(services.local).map((identifier) => [identifier, new Map()])) as {
			[K in keyof LocalServices]: Map<bigint, LocalServices[K]>;
		};
	}

	#localServicesFor({ guildId }: { guildId: bigint }): LocalService<TClient>[] {
		return [...Object.values(this.#local).map((services) => services.get(guildId))];
	}

	async setup(): Promise<void> {
		this.log.info("Setting up service store...");

		await this.#startGlobalServices();
		// Local services are started when Rost receives a guild.

		this.log.info("Service store set up.");
	}

	async teardown(): Promise<void> {
		this.log.info("Tearing down service store...");

		await this.#stopGlobalServices();
		await this.#stopAllLocalServices();

		this.log.info("Service store torn down.");
	}

	async #startGlobalServices(): Promise<void> {
		const services = this.#globalServices;

		this.log.info(`Starting global services... (${services.length} services to start)`);

		await this.#startServices(services);

		this.log.info("Global services started.");
	}

	async #stopGlobalServices(): Promise<void> {
		const services = this.#globalServices;

		this.log.info(`Stopping global services... (${services.length} services to stop)`);

		await this.#stopServices(services);

		this.log.info("Global services stopped.");
	}

	// TODO(vxern): What to do about this?
	async startForGuild({ guildId, guildDocument }: { guildId: bigint; guildDocument: Guild }): Promise<void> {
		const services: Service<TClient>[] = [];

		await this.#startLocalServices({ guildId, services });
	}

	async stopForGuild({ guildId }: { guildId: bigint }): Promise<void> {
		await this.#stopLocalServices({ guildId });
	}

	async #startLocalServices({ guildId, services }: { guildId: bigint; services: Service<TClient>[] }): Promise<void> {
		if (services.length === 0) {
			this.log.info(`There were no local services to start on ${this.#client.diagnostics.guild(guildId)}.`);
			return;
		}

		this.log.info(
			`Starting local services on ${this.#client.diagnostics.guild(guildId)}... (${services.length} services to start)`,
		);

		await this.#startServices(services);

		this.log.info(`Local services on ${this.#client.diagnostics.guild(guildId)} started.`);
	}

	async #stopLocalServices({ guildId }: { guildId: bigint }): Promise<void> {
		const services = this.#localServicesFor({ guildId });
		if (services.length === 0) {
			this.log.info(`There were no local services to stop on ${this.#client.diagnostics.guild(guildId)}.`);
			return;
		}

		this.log.info(
			`Stopping services on ${this.#client.diagnostics.guild(guildId)}... (${services.length} services to stop)`,
		);

		await this.#stopServices(services);

		this.log.info(`Local services on ${this.#client.diagnostics.guild(guildId)} stopped.`);
	}

	async #stopAllLocalServices(): Promise<void> {
		const services = this.#localServices;

		this.log.info(`Stopping all local services... (${services.length} services to stop)`);

		await this.#stopServices(services);

		this.log.info("All local services stopped.");
	}

	async #startServices(services: Service<TClient>[]): Promise<void> {
		await Promise.all(services.map((service) => service.start()));
	}

	async #stopServices(services: Service<TClient>[]): Promise<void> {
		await Promise.all(services.map((service) => service.stop()));
	}

	hasGlobalService<K extends keyof GlobalServices>(service: K): boolean {
		return this.#global[service] !== undefined;
	}

	/** ⚠️ If the service is not enabled, an error is raised. */
	global<K extends keyof GlobalServices>(service: K): NonNullable<GlobalServices[K]> {
		if (!this.hasGlobalService(service)) {
			throw new Error(`Attempted to get global service '${String(service)}' that is not enabled.`);
		}

		return this.#global[service]!;
	}

	hasLocalService<K extends keyof LocalServices>(service: K, { guildId }: { guildId: bigint }): boolean {
		return this.#local[service].has(guildId);
	}

	/** ⚠️ If the service is not enabled on the given guild, an error is raised. */
	local<K extends keyof LocalServices>(service: K, { guildId }: { guildId: bigint }): LocalServices[K] {
		if (!this.hasLocalService(service, { guildId })) {
			throw new Error(
				`Attempted to get local service '${String(service)}' that was not enabled on guild with ID ${guildId}.`,
			);
		}

		return this.#local[service].get(guildId)!;
	}
}

export { ServiceStore, Service, GlobalService, LocalService };
