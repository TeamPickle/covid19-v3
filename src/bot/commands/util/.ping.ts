import { oneLine } from 'common-tags';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class PingCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'ping',
      aliases: ['핑'],
      description: 'ping command',
      group: 'util',
      memberName: 'ping',
    });
  }

  async run(msg: CommandoMessage) {
    if (!this.client.owners?.includes(msg.author)) return null;
    return msg.respond(oneLine`
      ping: ${Date.now() - msg.createdTimestamp}ms.
      uptime: ${Math.floor((this.client.uptime || 0) / 1000)}s`);
  }
}
