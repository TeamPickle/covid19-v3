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
    console.log('test');
    return msg.reply(`${this.client.uptime}`);
  }
}
