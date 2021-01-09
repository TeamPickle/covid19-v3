import { stripIndents } from 'common-tags';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import Locations from '@src/bot/models/locationModel';

export default class PositionCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'setpos',
      aliases: ['위치지정', '위치설정'],
      description: 'setpos command',
      group: 'util',
      memberName: 'setpos',
      args: [{
        key: 'location',
        type: 'string',
        prompt: '',
        default: '',
      }],
    });
  }

  async run(msg: CommandoMessage, { location }: { location: string }) {
    const prefix = msg.guild?.commandPrefix || this.client.commandPrefix;
    if (!location) {
      const row = await Locations.findById(msg.author.id);
      if (!row) {
        return msg.channel.send(stripIndents`
          위치를 지정하지 않았습니다.
          명령어 사용법 : \`${prefix}위치지정 [시/도] [시/군/구]\`
          ex) \`${prefix}위치지정 서울 서초구\`
        `);
      }
      return msg.channel.send(stripIndents`
        위치: ${row.location}
        명령어 사용법 : \`${prefix}위치지정 [시/도] [시/군/구]\`
        ex) \`${prefix}위치지정 서울 서초구\`
      `);
    }
    await Locations.updateOne({ _id: msg.author.id }, { location }, { upsert: true });
    return msg.channel.send(`위치 지정이 완료되었습니다. 이제 \`${prefix}병원\` \`${prefix}재난문자\` 를 지역 입력 없이 사용할 시 지정한 위치의 정보를 불러옵니다.`);
  }
}
