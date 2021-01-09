import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class PrefixCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'prefix',
      aliases: ['접두사설정'],
      description: 'prefix command',
      group: 'util',
      memberName: 'prefix',
      guildOnly: true,
      args: [
        {
          key: 'prefix',
          prompt: '',
          default: '',
          type: 'string',
        },
      ],
    });
  }

  run = async (msg: CommandoMessage, { prefix }: { prefix: string }) => {
    if (!msg.member.permissions.has('ADMINISTRATOR')) {
      return msg.channel.send('서버관리자만 접두사를 변경할 수 있습니다.');
    }
    if (!prefix) {
      return msg.channel.send(`명령어 사용법: \`${msg.guild.commandPrefix}접두사설정 !\``);
    }
    const { guild } = msg;
    guild.commandPrefix = prefix;
    return msg.channel.send(`${prefix}(으)로 접두사를 변경했습니다. \`${prefix}도움\`과 같이 사용하실 수 있습니다.`);
  }
}
