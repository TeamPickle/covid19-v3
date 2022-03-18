import { stripIndents } from 'common-tags';
import { Client, MessageEmbed } from 'discord.js';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { format, increase } from '@src/bot/util/board';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

export default class SymptomCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'vaccine',
      aliases: ['백신'],
      description: 'vaccine command',
    });
  }

  runCommand = async (msg: ReceivedMessage) => {
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
    return msg.channel.send({ embeds: [embed] });
  };
}
