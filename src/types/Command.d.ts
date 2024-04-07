import { ApplicationCommandOptionType, CommandInteraction, Interaction, Message, SlashCommandBuilder } from 'discord.js';

type Command = {
	name: string;
	description: string;
	args: CommandArg[];

	permissions: bigint[];
	aliases: string[];

	dm?: boolean;
	ownerOnly?: boolean;

	slashOverride?: SlashCommandBuilder;

	slashRun: SlashCommandFunction;
	textRun: TextCommandFunction;
	interaction?: InteractionFunction;
};

type SlashCommandFunction = (interaction: CommandInteraction) => Promise<void>;
type TextCommandFunction = (msg: Message, args: string[]) => Promise<void>;
type InteractionFunction = (interaction: Interaction) => Promise<void>;

type CommandArg = {
	type: ApplicationCommandOptionType;
	name: string;
	description: string;
	required: boolean;
};
