import { Client, MessageAttachment } from 'discord.js';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

export default class GraphCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'graph',
      aliases: ['그래프'],
      description: 'graph command',
    });
  }

  runCommand = async (msg: ReceivedMessage) =>
    // const graphMessage = await msg.respond(new MessageAttachment(await makeGraph()));
    // await Graphs.create({
    //   url: graphMessage.attachments.first()?.url,
    // });
    null;
}
