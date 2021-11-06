import { format, increase } from '@src/bot/util/board';
import { stripIndents } from 'common-tags';
import { MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

export default class SymptomCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'vaccine',
      aliases: ['백신'],
      description: 'vaccine command',
      group: 'commands',
      memberName: 'vaccine',
    });
  }

  run = async (msg: CommandoMessage) => {
    const vaccineData = await (
      await fetch('https://nip.kdca.go.kr/irgd/cov19stats.do?list=all')
    ).text();
    const vaccineDoc = new JSDOM(vaccineData);
    const all = vaccineDoc.window.document.querySelectorAll('item')[2];
    const today = vaccineDoc.window.document.querySelectorAll('item')[0];
    const embed = new MessageEmbed();
    embed
      .setTitle('백신 접종 현황')
      .setDescription(
        stripIndents`
        <:vaccine1:905316440205328395> **1차 접종**: ${format(
          Number.parseInt(all.querySelector('firstCnt')?.innerHTML ?? '0', 10),
        )} \`(전일 대비: ${increase(
          Number.parseInt(
            today.querySelector('firstCnt')?.innerHTML ?? '0',
            10,
          ),
        )})\`
        <:vaccine2:905316440243073055> **2차 접종**: ${format(
          Number.parseInt(all.querySelector('secondCnt')?.innerHTML ?? '0', 10),
        )} \`(전일 대비: ${increase(
          Number.parseInt(
            today.querySelector('secondCnt')?.innerHTML ?? '0',
            10,
          ),
        )})\`
        <:vaccine3:905316440272437250> **3차 접종**: ${format(
          Number.parseInt(all.querySelector('thirdCnt')?.innerHTML ?? '0', 10),
        )} \`(전일 대비: ${increase(
          Number.parseInt(
            today.querySelector('thirdCnt')?.innerHTML ?? '0',
            10,
          ),
        )})\`
      `,
      )
      .setColor(0x006699);
    return msg.channel.send(embed);
  };
}
