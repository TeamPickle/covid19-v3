import { stripIndents } from 'common-tags';
import { Client } from 'discord.js';
import Locations from '@src/bot/models/locationModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix } from '@src/bot/util/prefix';

export default class PositionCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'setpos',
      aliases: ['위치지정', '위치설정'],
      description: 'setpos command',
    });
  }

  runCommand = async (msg: ReceivedMessage, [, location]: string[]) => {
    const prefix = getGuildPrefix(msg.guild);
    if (!location) {
      const row = await Locations.findById(msg.author.id);
      if (!row) {
        return msg.respond(stripIndents`
          위치를 지정하지 않았습니다.
          명령어 사용법 : \`${prefix}위치지정 [시/도] [시/군/구]\`
          ex) \`${prefix}위치지정 서울 서초구\`
        `);
      }
      return msg.respond(stripIndents`
        위치: ${row.location}
        명령어 사용법 : \`${prefix}위치지정 [시/도] [시/군/구]\`
        ex) \`${prefix}위치지정 서울 서초구\`
      `);
    }
    await Locations.updateOne(
      { _id: msg.author.id },
      { location },
      { upsert: true },
    );
    return msg.respond(
      `위치 지정이 완료되었습니다. 이제 \`${prefix}병원\` \`${prefix}재난문자\` 를 지역 입력 없이 사용할 시 지정한 위치의 정보를 불러옵니다.`,
    );
  };
}
