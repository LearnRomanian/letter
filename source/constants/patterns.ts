const patterns = Object.freeze({
	/** Used for matching hex colour representations, e.g. #ffffff */
	rgbHex: /^#[0-9a-f]{6}$/,
	discord: {
		/** Used for matching Discord IDs (snowflakes), e.g. 1071782537564803163 */
		snowflake: /^(\d{16,20})$/,
		/** Used for matching user mentions, e.g. <@902895279236333590> */
		userMention: /^<@!?(\d{16,20})>$/,
	},
	userDisplay: /^.*?\(?(\d{16,20})\)?$/,
} as const);

function isValidSnowflake(snowflake: string): boolean {
	return patterns.discord.snowflake.test(snowflake);
}

function getSnowflakeFromIdentifier(identifier: string): string | undefined {
	return (
		patterns.discord.snowflake.exec(identifier)?.at(1) ??
		patterns.discord.userMention.exec(identifier)?.at(1) ??
		patterns.userDisplay.exec(identifier)?.at(1)
	);
}

export default patterns;
export { isValidSnowflake, getSnowflakeFromIdentifier };
