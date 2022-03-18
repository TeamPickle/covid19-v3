import Settings from '@src/bot/models/settingsModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix } from '@src/bot/util/prefix';
import { Client } from 'discord.js';

export default class DndCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'dnd',
      aliases: ['방해금지'],
      description: 'dnd command',
      commandOnly: 'onlyGuildChannel',
    });
  }

  runCommand = async (msg: ReceivedMessage, [, response]: string[]) => {
    if (!msg.guild) return null;
    const member = await msg.guild.members.fetch(msg.author.id);
    if (!member?.permissions.has('ADMINISTRATOR'))
      return msg.respond(
        '서버관리자만 방해금지 모드 옵션을 지정할 수 있습니다.',
      );
    const prefix = getGuildPrefix(msg.guild);
    // eslint-disable-next-line no-nested-ternary
    const enable = ['ㅇ', 'y', 'Y'].includes(response)
      ? true
      : ['ㄴ', 'n', 'N'].includes(response)
      ? false
      : undefined;
    if (enable === undefined)
      return msg.respond(`명령어 사용법 : ${prefix}방해금지 [ㅇ/ㄴ]`);
    if (enable) {
      await Settings.updateOne(
        { _id: msg.guild.id },
        { dnd: true },
        { upsert: false },
      );
      return msg.respond('방해금지 모드가 설정되었습니다.');
    }
    await Settings.updateOne(
      { _id: msg.guild.id },
      { dnd: false },
      { upsert: false },
    );
    return msg.respond('방해금지 모드가 해제되었습니다.');
  };
}
