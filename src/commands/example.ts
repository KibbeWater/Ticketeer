import {
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";
import { SlashCommandFunction, TextCommandFunction } from "../types/Command";
import { defineCommand, utils } from "../utils";

const _slashCmdRun: SlashCommandFunction = async (interaction) => {
  const _name = interaction.options.get("name");
  const _age = interaction.options.get("age");

  const name =
    _name?.type === ApplicationCommandOptionType.String
      ? _name.value
      : undefined;
  const age =
    _age?.type === ApplicationCommandOptionType.Number ? _age.value : undefined;

  interaction.reply({
    content: `Your name is ${name} and you are ${age} years old`,
    ephemeral: true,
  });
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
  name: "example",
  description: "example description",
  args: [
    {
      type: ApplicationCommandOptionType.String,
      name: "name",
      description: "Your name",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Number,
      name: "age",
      description: "Your age",
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
