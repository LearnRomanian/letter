import type { Locale } from "../client.ts";
import commonEuropean from "./common-european.ts";
import commonSlavic from "./common-slavic.ts";
import invariant from "./invariant.ts";
import romanian from "./romanian.ts";
import unsupported from "./unsupported.ts";

type Transformer = (matchTerm: string, matches: Record<string, string>) => string | undefined;

const pluralisers = {
	da: commonEuropean,
	nl: commonEuropean,
	"en-US": commonEuropean,
	"en-GB": commonEuropean,
	fi: commonEuropean,
	fr: commonEuropean,
	de: commonEuropean,
	el: commonEuropean,
	hu: invariant,
	no: commonEuropean,
	pl: commonSlavic,
	ro: romanian,
	ru: commonSlavic,
	"es-ES": commonEuropean,
	"sv-SE": commonEuropean,
	tr: invariant,
	id: unsupported,
	"es-419": unsupported,
	hr: unsupported,
	it: unsupported,
	lt: unsupported,
	"pt-BR": unsupported,
	vi: unsupported,
	cs: unsupported,
	bg: unsupported,
	uk: unsupported,
	hi: unsupported,
	th: unsupported,
	"zh-CN": unsupported,
	ja: unsupported,
	"zh-TW": unsupported,
	ko: unsupported,
} satisfies Record<Locale, Transformer>;

function pluralise(quantity: string, terms: Record<string, string>, { locale }: { locale: Locale }) {
	const pluralise = pluralisers[locale];

	return pluralise(quantity, terms);
}

export { pluralise };
