import { Interaction, Message } from 'discord.js';
import client, { commands, guildPrefix } from '..';

const commandHandler = (received: Message | Interaction) => {
  if (received instanceof Message) {
    const prefix =
      received.channel.type === 'DM'
        ? '!'
        : guildPrefix.find((g) => g.id === received.guild?.id)?.prefix ?? '!';
    if (
      !(
        !received.author.bot &&
        (received.content.startsWith(prefix) ||
          received.content.startsWith(`<@${client.user?.id}> `) ||
          received.content.startsWith(`<@!${client.user?.id}> `))
      )
    )
      return;

    const args = received.content
      .replace(new RegExp(`<@${client.user?.id}> `, 'gi'), '')
      .replace(new RegExp(`<@!${client.user?.id}> `, 'gi'), '')
      .split(' ');

    args[0] = args[0].replace(prefix, '');

    commands
      .find(
        (cmd) =>
          cmd.commandOption.name === args[0].toLowerCase() ||
          cmd.commandOption.aliases?.includes(args[0].toLowerCase()),
      )
      ?.run(received, args);
    return;
  }

  if (!received.isCommand()) return;

  const args: string[] = [received.commandName];
  received.options.data.map((arg) => args.push(`${arg.value}`));

  commands
    .find(
      (cmd) =>
        cmd.commandOption.name === received.commandName ||
        cmd.commandOption.aliases?.includes(received.commandName),
    )
    ?.run(received, args);
};

export default commandHandler;
