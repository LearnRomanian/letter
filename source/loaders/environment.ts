import type { Logger } from "pino";

interface BaseEnvironment {
	readonly discordSecret: string;
	readonly databaseSolution?: string;
	readonly mongodbUsername?: string;
	readonly mongodbPassword?: string;
	readonly mongodbHost?: string;
	readonly mongodbPort?: string;
	readonly mongodbDatabase?: string;
	readonly ravendbHost?: string;
	readonly ravendbPort?: string;
	readonly ravendbDatabase?: string;
	readonly ravendbSecure?: string;
	readonly couchdbUsername?: string;
	readonly couchdbPassword?: string;
	readonly couchdbProtocol?: string;
	readonly couchdbHost?: string;
	readonly couchdbPort?: string;
	readonly couchdbDatabase?: string;
	readonly rethinkdbUsername?: string;
	readonly rethinkdbPassword?: string;
	readonly rethinkdbHost?: string;
	readonly rethinkdbPort?: string;
	readonly rethinkdbDatabase?: string;
}

function loadEnvironment<
	CustomEnvironment extends Record<string, string>,
	Environment extends BaseEnvironment & CustomEnvironment,
>({
	log,
	mapProperties,
}: {
	log: Logger;
	mapProperties: (variables: Record<string, string | undefined>) => CustomEnvironment;
}): Environment {
	log = log.child({ name: "Environment" });

	log.debug("Loading environment...");

	if (process.env.SECRET_DISCORD === undefined) {
		log.fatal(
			"Letter cannot start without a Discord token. Make sure you've included one in the environment variables with the key `SECRET_DISCORD`.",
		);
		process.exit(1);
	}

	const environment: BaseEnvironment & CustomEnvironment = {
		...mapProperties(process.env),
		discordSecret: process.env.SECRET_DISCORD,
		databaseSolution: process.env.DATABASE_SOLUTION,
		mongodbUsername: process.env.MONGODB_USERNAME || undefined,
		mongodbPassword: process.env.MONGODB_PASSWORD || undefined,
		mongodbHost: process.env.MONGODB_HOST,
		mongodbPort: process.env.MONGODB_PORT,
		mongodbDatabase: process.env.MONGODB_DATABASE,
		ravendbHost: process.env.RAVENDB_HOST,
		ravendbPort: process.env.RAVENDB_PORT,
		ravendbDatabase: process.env.RAVENDB_DATABASE,
		ravendbSecure: process.env.RAVENDB_SECURE,
		couchdbUsername: process.env.COUCHDB_USERNAME,
		couchdbPassword: process.env.COUCHDB_PASSWORD,
		couchdbProtocol: process.env.COUCHDB_PROTOCOL,
		couchdbHost: process.env.COUCHDB_HOST,
		couchdbPort: process.env.COUCHDB_PORT,
		couchdbDatabase: process.env.COUCHDB_DATABASE,
		rethinkdbUsername: process.env.RETHINKDB_USERNAME || undefined,
		rethinkdbPassword: process.env.RETHINKDB_PASSWORD || undefined,
		rethinkdbHost: process.env.RETHINKDB_HOST,
		rethinkdbPort: process.env.RETHINKDB_PORT,
		rethinkdbDatabase: process.env.RETHINKDB_DATABASE,
	};

	log.debug("Environment loaded.");

	return environment as unknown as Environment;
}

export { loadEnvironment };
export type { BaseEnvironment };
