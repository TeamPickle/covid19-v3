import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import send from '@src/bot/util/send';

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

const getContent = async (msg: CommandoMessage) => {
  await msg.reply('전송할 내용을 입력해주세요');
  const response = await msg.channel.awaitMessages(
    (m: Message) => m.author.id === msg.author.id, { max: 1, time: 60 * 1000 },
  );
  return response.first()?.content.toString();
};

const confirmContent = async (msg: CommandoMessage, embed: MessageEmbed) => {
  await msg.reply('위와 같이 공지 메시지를 전송하시겠습니까?[ㅇ/ㄴ]', embed);
  const response = await msg.channel.awaitMessages(
    (m: Message) => m.author.id === msg.author.id, { max: 1, time: 60 * 1000 },
  );
  return response.first()?.content.toString();
};

export default class SendCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'send',
      aliases: ['전송'],
      description: 'send command',
      group: 'commands',
      memberName: 'send',
      ownerOnly: true,
      args: [{
        key: 'mode',
        prompt: Object.keys(modes).join('/'),
        parse: (val: string) => val,
        validate: (val: string) => Object.keys(modes).includes(val),
      }],
    });
  }

  async run(msg: CommandoMessage, { mode }: { mode: Mode }) {
    const content = await getContent(msg);
    if (!content) return msg.reply('입력되지 않았습니다.');

    const embed = new MessageEmbed();
    embed
      .setTitle(`${modes[mode].emoji} ${mode}`)
      .setColor(modes[mode].color)
      .setDescription(content);

    const confirm = await confirmContent(msg, embed);
    if (!confirm) return msg.reply('입력되지 않았습니다.');
    if (confirm !== 'ㅇ' && confirm.toLowerCase() !== 'y') return msg.reply('취소되었습니다.');

    const { sended, toSendSize } = await send(this.client, embed);
    return msg.channel.send(`${sended}/${toSendSize}`);
  }
}
