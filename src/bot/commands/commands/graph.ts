import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MessageAttachment } from 'discord.js';
import makeGraph from '@src/bot/util/graph';

export default class GraphCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'graph',
      aliases: ['그래프'],
      description: 'graph command',
      group: 'commands',
      memberName: 'graph',
    });
  }

  run = async (msg: CommandoMessage) => {
    return msg.channel.send(new MessageAttachment(await makeGraph()));
  }
}
