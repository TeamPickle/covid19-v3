import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class SymptomCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'symptom',
      aliases: ['증상'],
      description: 'symptom command',
      group: 'commands',
      memberName: 'symptom',
    });
  }

  run = async (msg: CommandoMessage) => {
    const embed = new MessageEmbed();
    embed
      .setTitle('COVID-19(코로나19) 증상 안내')
      .setDescription(stripIndents`
        발열(37.5도 이상)
        호흡기 증상(기침, 가래, 인후통 등)
        폐렴 증상
        미각 또는 후각 이상 등

        위 증상들이 있는 경우 __**병원이나 응급실로 바로 들어가지 마시고, 병원 앞에 마련된 선별 진료소를 통해 진료**__를 받으시기 바랍니다.
        감염이 의심된다면 지역보건소 또는 1339, 지역번호+120을 통해 먼저 상담을 받으시기 바랍니다.

        지역 별 선별 진료소 현황은 아래 링크에서 확인하실 수 있습니다:
        http://www.mohw.go.kr/react/popup_200128.html
      `)
      .setColor(0x006699);
    return msg.channel.send(embed);
  }
}
