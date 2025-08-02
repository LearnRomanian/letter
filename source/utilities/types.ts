import type {
	DesiredPropertiesBehavior,
	Locales,
	SetupDesiredProps,
	TransformersDesiredProperties,
	TransformersObjects,
} from "@discordeno/bot";

type Locale = `${Locales}`;

type Letter<
	Type extends TransformersObjects[keyof TransformersObjects],
	TDesiredProperties extends BaseDesiredProperties,
	TDesiredPropertiesBehavior extends DesiredPropertiesBehavior,
> = SetupDesiredProps<Type, TDesiredProperties, TDesiredPropertiesBehavior>;

type BaseDesiredProperties = TransformersDesiredProperties & {
	guild: {
		name: true;
	};
};

export type { Locale, Letter, BaseDesiredProperties };
