import { CommandInteraction, Message } from 'discord.js';
import { errorLogChannel } from '..';
import ReceivedMessage from './ReceivedMessage';

export interface CommandOptions {
  name: string;
  aliases?: string[];
  description: string;
  commandOnly?: 'onlyDM' | 'onlyGuildChannel';
  isAdminCommand?: boolean;
}

export default abstract class AbstractCommandBase {
  commandOption: CommandOptions;

  constructor(options: CommandOptions) {
    this.commandOption = options;
  }

  private commandErrorHandler = (
    msg: ReceivedMessage,
    args: string[],
    err: Error,
  ) => {
    if (err.message === 'Unknown Message') return;

    const errcode = Math.random().toString(36).substr(2, 10);

    if (['Missing Permissions', 'Missing Access'].includes(err.message)) {
      msg.respond({
        embeds: [
          {
            color: 0xff7b7b,
            title: `권한이 부족합니다.`,
            description:
              '코로나 19알림봇이 해당 기능을 수행하기 위한 권한이 부족합니다.\n봇에게 필요한 권한을 부여한 뒤 다시 시도하시기 바라며, 오류가 지속될 경우 [Team Pickle 공식 포럼](https://forum.tpk.kr)에서 아래 오류 코드를 가지고 문의하실 수 있습니다.',
            fields: [{ name: '오류 코드', value: `\`\`\`${errcode}\`\`\`` }],
          },
        ],
      });
    } else {
      msg.respond({
        embeds: [
          {
            color: 0xff7b7b,
            title: `오류가 발생했습니다.`,
            description:
              '[Team Pickle 공식 포럼](https://discord.gg/CwScQ3N)에서 아래 오류 코드를 가지고 문의하실 수 있습니다.',
            fields: [{ name: '오류 코드', value: `\`\`\`${errcode}\`\`\`` }],
          },
        ],
      });
    }
    errorLogChannel.send(
      `오류가 발생했습니다.\nAuthor: ${msg.author.tag} (${
        msg.author.id
      })\nCommand: ${args.join(' ')}\nCode: ${errcode}`,
    );
    errorLogChannel.send(`Stack:\n\`\`\`${err.stack}\`\`\``);
    errorLogChannel.send(`Error:\`\`\`${err.message}\`\`\``);
  };

  abstract runCommand(
    msg: ReceivedMessage,
    args: string[],
  ): Promise<Message | Message[] | null>;

  async run(msg: Message | CommandInteraction, args: string[]) {
    const receivedMessage = new ReceivedMessage(msg);

    if (
      this.commandOption.isAdminCommand &&
      ![
        '324209390573846533', // happycastle
        '726534821572116512', // 강현섭
        '736054289663000586', // 김들
        '371938007600726026', // Lotinex
        '485801939431456799', // 무언가
        '264788350227972097', // 승빈
        '542950383098789889', // 스코
        '226138320260956160', // CraftyDragon678
        '367272810105798656', // Pi
        '694174492922216529', // 희망
        '779313289368174613', // 마리
        '887330193092522045', // cra1nbow
      ].includes(receivedMessage.author.id)
    ) {
      return;
    }

    if (
      this.commandOption.commandOnly === 'onlyDM' &&
      receivedMessage.channel.type !== 'DM'
    )
      return receivedMessage.respond('DM에서만 사용 가능한 명령어입니다.');

    if (
      this.commandOption.commandOnly === 'onlyGuildChannel' &&
      receivedMessage.channel.type === 'DM'
    )
      return receivedMessage.respond('서버에서만 사용 가능한 명령어입니다.');

    return this.runCommand(receivedMessage, args).catch((err) =>
      this.commandErrorHandler(receivedMessage, args, err),
    );
  }
}
