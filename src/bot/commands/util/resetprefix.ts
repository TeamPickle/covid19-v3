import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class PingCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'resetprefix',
      aliases: ['접두사초기화'],
      description: 'resetprefix command',
      group: 'util',
      memberName: 'resetprefix',
      guildOnly: true,
      patterns: [/!resetprefix/, /!접두사초기화/],
    });
  }

  run = async (msg: CommandoMessage) => {
    const { guild } = msg;
    guild.commandPrefix = this.client.commandPrefix;
    return msg.channel.send('접두사를 초기화 했습니다. ``!도움``과 같이 사용하실 수 있습니다.');
  }
}
