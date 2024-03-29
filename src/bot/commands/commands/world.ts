import { oneLine, stripIndents } from 'common-tags';
import {
  Client,
  Message,
  MessageEmbed,
  MessageReaction,
  User,
} from 'discord.js';
import { CoronaBoardData } from '@src/types/board';
import { parseBoard, format, increase } from '@src/bot/util/board';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

const mainEmbed = (maxPage: number, data: CoronaBoardData) => {
  const embed = new MessageEmbed();
  embed
    .setTitle('🗺️ 세계 코로나 현황')
    .setDescription(
      stripIndents`
      <:chiryojung:711728328985411616> 치료중 : ${format(
        data.chartForGlobal.global.active.slice(-1)[0],
      )}
      <:nujeok:687907310923677943> 확진자 : ${format(
        data.chartForGlobal.global.confirmed_acc.slice(-1)[0],
      )}(${increase(data.chartForGlobal.global.confirmed.slice(-1)[0])})
      <:wanchi:687907312052076594> 완치 : ${format(
        data.chartForGlobal.global.released_acc.slice(-1)[0],
      )}(${increase(data.chartForGlobal.global.released.slice(-1)[0])})
      <:samang:687907312123510817> 사망 : ${format(
        data.chartForGlobal.global.death_acc.slice(-1)[0],
      )}(${increase(data.chartForGlobal.global.death.slice(-1)[0])})

      🚩 발생국 : ${data.statGlobalNow.length}
      (1/${maxPage})
    `,
    )
    .setColor(0x00cccc);
  return embed;
};

/**
 * return detail embed
 * @param start include
 * @param end exclude
 * @param data from parseBoard
 */
const detailEmbed = (
  start: number,
  end: number,
  page: number,
  maxPage: number,
  data: CoronaBoardData,
) => {
  const globalStat = data.statGlobalNow
    .sort((a, b) => b.confirmed - a.confirmed)
    .slice(start, end);
  const embed = new MessageEmbed();
  embed
    .setTitle('🗺️ 세계 코로나 현황')
    .setDescription(
      stripIndents`
      ${globalStat
        .map(
          (status) => oneLine`
          ${status.flag}
          **${data.i18nAll.ko[status.cc]}** :
          <:nujeok:687907310923677943> ${format(status.confirmed)}
          / <:wanchi:687907312052076594> ${format(status.released)}
          / <:samang:687907312123510817> ${format(status.death)}
      `,
        )
        .join('\n')}
      (${page}/${maxPage})
    `,
    )
    .setColor(0x00cccc);
  return embed;
};

const getEmbedByPage = (
  page: number,
  maxPage: number,
  data: CoronaBoardData,
) => {
  if (page === 0) return mainEmbed(maxPage, data);
  return detailEmbed((page - 1) * 10, page * 10, page + 1, maxPage, data);
};

const handleEmbedMessage = async (
  requester: User,
  embedMessage: Message,
  data: CoronaBoardData,
  page: number = 0,
): Promise<Message> => {
  const maxPage = Math.ceil(data.statGlobalNow.length / 10 + 1);
  await embedMessage.edit({ embeds: [getEmbedByPage(page, maxPage, data)] });

  const react = await embedMessage.awaitReactions({
    filter: (reaction: MessageReaction, user: User) =>
      ['◀️', '▶️'].includes(reaction.emoji.name ?? '') &&
      requester.id === user.id,
    max: 1,
    time: 30000,
  });
  const emojiName = react.first()?.emoji.name;
  if (!emojiName) {
    return embedMessage.reactions.removeAll();
  }

  react.first()?.users.remove(requester);

  if (emojiName === '◀️') {
    return handleEmbedMessage(
      requester,
      embedMessage,
      data,
      (page - 1 + maxPage) % maxPage,
    );
  }
  return handleEmbedMessage(
    requester,
    embedMessage,
    data,
    (page + 1 + maxPage) % maxPage,
  );
};

export default class WorldCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'worldstatus',
      aliases: ['세계현황', '지구현황'],
      description: 'world status command',
    });
  }

  runCommand = async (msg: ReceivedMessage) => {
    const data = await parseBoard();
    if (!data) return msg.respond('정보를 가져올 수 없습니다.');
    const client = this.client.user;
    if (!client) return msg.respond('권한을 가져올 수 없습니다.');
    if (
      msg.channel.type !== 'DM' &&
      !msg.channel
        .permissionsFor(client)
        ?.has([
          'ADD_REACTIONS',
          'VIEW_CHANNEL',
          'MANAGE_MESSAGES',
          'EMBED_LINKS',
          'ATTACH_FILES',
          'USE_EXTERNAL_EMOJIS',
        ])
    ) {
      return msg.respond(oneLine`
        필요한 권한(메시지 관리, 이모티콘 관리, 반응 추가하기)이 할당되지 않아
        기능이 제대로 작동하지 않습니다. 권한을 할당해주세요.
      `);
    }

    const embedMessage = await msg.respond({
      embeds: [new MessageEmbed({ title: '가져오는 중' })],
    });

    await embedMessage.react('◀️');
    await embedMessage.react('▶️');

    return handleEmbedMessage(msg.author, embedMessage, data);
  };
}
