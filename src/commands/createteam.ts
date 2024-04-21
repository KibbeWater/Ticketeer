import {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";
import { SlashCommandFunction, TextCommandFunction } from "../types/Command";
import { defineCommand, utils } from "../utils";
import { prisma } from "../db";

const _slashCmdRun: SlashCommandFunction = async (interaction) => {
  const _name = interaction.options.get("name");

  const name =
    _name?.type === ApplicationCommandOptionType.String
      ? (_name.value as string)
      : undefined;

  if (!name) return;

  const team = await prisma.team.create({
    data: {
      name,
      guild: {
        connectOrCreate: {
          where: { guildId: interaction.guildId! },
          create: { guildId: interaction.guildId! },
        },
      },
    },
  });

  await interaction.reply(`Team "${team.name}" has been created`);
};

const _textRun: TextCommandFunction = async (msg, args) => {
  const name = args[0];

  if (!name) return;

  const team = await prisma.team.create({
    data: {
      name,
      guild: {
        connectOrCreate: {
          where: { guildId: msg.guildId! },
          create: { guildId: msg.guildId! },
        },
      },
    },
  });

  await msg.reply(`Team "${team.name}" has been created`);
};

const command = defineCommand({
  // Required
  name: "createteam",
  description: "Create a new support team.",
  args: [
    {
      type: ApplicationCommandOptionType.String,
      name: "name",
      description: "Name of the support team",
      required: true,
    },
  ],

  // More optional
  permissions: [PermissionFlagsBits.Administrator],
  aliases: [],
  dm: false,

  // Run methods
  slashRun: _slashCmdRun,
  textRun: _textRun,
});

export default command;
