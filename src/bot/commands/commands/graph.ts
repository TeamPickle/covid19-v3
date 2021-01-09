import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { MessageAttachment } from 'discord.js';
import makeGraph from '@src/bot/util/graph';
import Graphs from '@src/bot/models/graphModel';

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
    const graphMessage = await msg.channel.send(new MessageAttachment(await makeGraph()));
    await Graphs.create({
      url: graphMessage.attachments.first()?.url,
    });
    return null;
  }
}
