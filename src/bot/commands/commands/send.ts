import { Client, Message, MessageEmbed } from 'discord.js';
import send from '@src/bot/util/send';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';

type Mode = '속보' | '뉴스' | '해외' | '확진' | '사망' | '전체공지';

const modes: {
  [key in Mode]: {
    color: number;
    emoji: string;
  };
} = {
  속보: {
    color: 0xff4848,
    emoji: '<:sokbo:687907311875915845>',
  },
  뉴스: {
    color: 0x6699ff,
    emoji: '<:gisa:687907312102670346>',
  },
  사망: {
    color: 0x222222,
    emoji: '<:samang:687907312123510817>',
  },
  해외: {
    color: 0x9966ff,
    emoji: '<:waeguk:687907310982791183>',
  },
  확진: {
    color: 0xff7c80,
    emoji: '<:nujeok:687907310923677943>',
  },
  전체공지: {
    color: 0x555555,
    emoji: '📢',
  },
};

const getContent = async (msg: ReceivedMessage) => {
  await msg.respond('전송할 내용을 입력해주세요');
  const response = await msg.channel.awaitMessages({
    filter: (m: Message) => m.author.id === msg.author.id,
    max: 1,
    time: 60e3,
  });
  return response.first()?.content.toString();
};

const confirmContent = async (msg: ReceivedMessage, embed: MessageEmbed) => {
  await msg.respond({
    content: '위와 같이 공지 메시지를 전송하시겠습니까?[ㅇ/ㄴ]',
    embeds: [embed],
  });
  const response = await msg.channel.awaitMessages({
    filter: (m: Message) => m.author.id === msg.author.id,
    max: 1,
    time: 60e3,
  });
  return response.first()?.content.toString();
};

export default class SendCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'send',
      aliases: ['전송'],
      description: 'send command',
      isAdminCommand: true,
    });
  }

  runCommand = async (msg: ReceivedMessage, [, modeString]: string[]) => {
    const mode = modes[modeString as Mode];
    if (!mode) {
      return msg.respond('잘못된 인자');
    }
    const content = await getContent(msg);
    if (!content) return msg.respond('입력되지 않았습니다.');

    const embed = new MessageEmbed();
    embed
      .setTitle(`${mode.emoji} ${modeString}`)
      .setColor(mode.color)
      .setDescription(content);

    const confirm = await confirmContent(msg, embed);
    if (!confirm) return msg.respond('입력되지 않았습니다.');
    if (confirm !== 'ㅇ' && confirm.toLowerCase() !== 'y')
      return msg.respond('취소되었습니다.');

    const { sended, toSendSize } = await send(this.client, { embeds: [embed] });
    return msg.respond(`${sended}/${toSendSize}`);
  };
}
