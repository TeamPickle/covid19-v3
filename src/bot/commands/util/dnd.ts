import Dnds from '@src/bot/models/dndModel';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class DndCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'dnd',
      aliases: ['방해금지'],
      description: 'dnd command',
      group: 'util',
      memberName: 'dnd',
      guildOnly: true,
      args: [{
        key: 'response',
        prompt: '',
        default: '',
        type: 'string',
      }],
    });
  }

  run = async (msg: CommandoMessage, { response }: { response: string }) => {
    if (!msg.member.permissions.has('ADMINISTRATOR')) return msg.channel.send('서버관리자만 방해금지 모드 옵션을 지정할 수 있습니다.');
    const enable = ['ㅇ', 'y', 'Y'].includes(response) ? true
      : ['ㄴ', 'n', 'N'].includes(response) ? false : undefined;
    if (enable === undefined) return msg.channel.send(`명령어 사용법 : ${msg.guild.commandPrefix}방해금지 [ㅇ/ㄴ]`);
    if (enable) {
      await new Dnds({ _id: msg.guild.id }).save();
      return msg.channel.send('방해금지 모드가 설정되었습니다.');
    }
    await Dnds.findByIdAndRemove(msg.guild.id);
    return msg.channel.send('방해금지 모드가 해제되었습니다.');
  }
}
