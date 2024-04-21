import {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";
import { SlashCommandFunction, TextCommandFunction } from "../types/Command";
import { defineCommand, utils } from "../utils";
import { EmbedBuilder } from "discord.js";
import { TeamRole } from "@prisma/client";
import { prisma } from "../db";

type modifyableKeysType = "canReceiveTickets";
const modifyableKeys = ["canReceiveTickets"];

function getRoleRules(role: TeamRole) {
  const rules = Object.entries(role)
    .filter(([key]) => modifyableKeys.includes(key))
    .filter(([_, value]) => typeof value === "boolean");

  return rules as [string, boolean][];
}

const _slashCmdRun: SlashCommandFunction = async (interaction) => {
  const _role = interaction.options.get("role");
  const _action = interaction.options.get("action");
  const _key = interaction.options.get("key");
  const _value = interaction.options.get("value");

  const roleName =
    _role?.type === ApplicationCommandOptionType.String
      ? (_role.value as string)
      : undefined;
  const action =
    _action?.type === ApplicationCommandOptionType.String
      ? (_action.value as "set" | "getall")
      : undefined;
  const key =
    _key?.type === ApplicationCommandOptionType.String
      ? (_key.value as string)
      : undefined;
  const value =
    _value?.type === ApplicationCommandOptionType.String
      ? (_value.value as string)
      : undefined;

  const role = await prisma.teamRole.findFirst({
    where: {
      name: roleName,
      team: { guild: { guildId: interaction.guildId! } },
    },
  });

  if (!roleName || !action) {
    await interaction.reply({
      content: "Missing required arguments",
      ephemeral: true,
    });
    return;
  }
  if (!role) {
    await interaction.reply({
      content: `Role ${roleName} does not exist in this guild`,
      ephemeral: true,
    });
    return;
  }
  if (action !== "set" && action !== "getall") {
    await interaction.reply({ content: "Invalid action", ephemeral: true });
    return;
  }

  if (action === "getall") {
    const rules = getRoleRules(role);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${role.name}'s settings`)
          .setDescription(
            rules
              .map(([key, value]) => `**${key}:** ${value ? "yes" : "no"}`)
              .join("\n"),
          ),
      ],
      ephemeral: true,
    });
    return;
  }

  if (action === "set") {
    if (!key || !value) {
      await interaction.reply({
        content: "Missing required arguments",
        ephemeral: true,
      });
      return;
    }

    if (!modifyableKeys.includes(key)) {
      await interaction.reply({ content: "Invalid key", ephemeral: true });
      return;
    }

    const newValue = value === "true";

    const newRole = await prisma.teamRole.update({
      where: { id: role.id },
      data: { [key]: newValue },
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${newRole.name}'s settings`)
          .setDescription(
            getRoleRules(newRole)
              .map(([key, value]) => `**${key}:** ${value ? "yes" : "no"}`)
              .join("\n"),
          ),
      ],
      ephemeral: true,
    });
    return;
  }
};

const _textRun: TextCommandFunction = async (msg, args) => {
  let age = parseInt(args[1]);
  if (isNaN(age)) {
    utils.messages.badUsage(msg, command);
    return;
  }

  await msg.reply(`Your name is ${args[0]} and you are ${args[1]} years old`);
};

const command = defineCommand({
  // Required
  name: "managerole",
  description: "example description",
  args: [
    {
      type: ApplicationCommandOptionType.String,
      name: "role",
      description: "Role to manage",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "action",
      description: "Action to perform on the role rule",
      required: true,
      choices: [
        {
          name: "Set",
          value: "set",
        },
        {
          name: "Get All",
          value: "getall",
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "key",
      description: "Rule key/name",
      required: false,
      choices: modifyableKeys.map((key) => ({ name: key, value: key })),
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "value",
      description: "Rule value",
      required: false,
      choices: [
        {
          name: "True",
          value: "true",
        },
        {
          name: "False",
          value: "false",
        },
      ],
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
