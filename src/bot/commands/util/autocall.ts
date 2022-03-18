import Autocalls from '@src/bot/models/autocallModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix } from '@src/bot/util/prefix';
import { Client } from 'discord.js';

export default class AutocallCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'autocall',
      aliases: ['현황알림'],
      description: 'autocall command',
    });
  }

  runCommand = async (msg: ReceivedMessage, [, response]: string[]) => {
    if (msg.channel.type !== 'DM')
      return msg.channel.send('DM에서만 현황알림을 사용할 수 있습니다.');
    // eslint-disable-next-line no-nested-ternary
    const enable = ['ㅇ', 'y', 'Y'].includes(response)
      ? true
      : ['ㄴ', 'n', 'N'].includes(response)
      ? false
      : undefined;
    if (enable === undefined)
      return msg.channel.send(
        `명령어 사용법 : ${getGuildPrefix()}현황알림 [ㅇ/ㄴ]`,
      );
    if (enable) {
      if (await Autocalls.findById(msg.author.id))
        return msg.channel.send('이미 현황알림을 사용중 입니다.');
      await new Autocalls({ _id: msg.author.id }).save();
      return msg.channel.send('현황알림 옵션이 설정되었습니다.');
    }
    await Autocalls.findByIdAndRemove(msg.author.id);
    return msg.channel.send('현황알림 옵션이 해제되었습니다.');
  };
}
