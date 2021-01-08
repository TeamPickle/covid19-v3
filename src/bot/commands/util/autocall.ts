import Autocalls  from '@src/bot/models/autocallModel';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class AutocallCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'autocall',
      aliases: ['현황알림'],
      description: 'autocall command',
      group: 'util',
      memberName: 'autocall',
      args: [{
        key: 'response',
        prompt: '',
        default: '',
        type: 'string',
      }],
    });
  }

  async run(msg: CommandoMessage, { response }: { response: string }) {
    if (msg.channel.type !== 'dm') return msg.channel.send('DM에서만 현황알림을 사용할 수 있습니다.');
    const enable = ['ㅇ', 'y', 'Y'].includes(response) ? true
      : ['ㄴ', 'n', 'N'].includes(response) ? false : undefined;
    if (enable === undefined) return msg.channel.send(`명령어 사용법 : ${this.client.commandPrefix}현황알림 [ㅇ/ㄴ]`);
    if (enable) {
      await new Autocalls({ _id: msg.author.id }).save();
      return msg.channel.send('현황알림 옵션이 설정되었습니다.');
    }
    await Autocalls.findByIdAndRemove(msg.author.id);
    return msg.channel.send('현황알림 옵션이 해제되었습니다.');
  }
}
