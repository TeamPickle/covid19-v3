import { stripIndents } from 'common-tags';
import { Channel, Client } from 'discord.js';
import { getDefaultChannel } from '@src/bot/util/send';
import Settings from '@src/bot/models/settingsModel';
import CommandBase from '@src/bot/structure/CommandBase';
import ReceivedMessage from '@src/bot/structure/ReceivedMessage';
import { getGuildPrefix } from '@src/bot/util/prefix';

export default class ChannelCommand extends CommandBase {
  constructor(client: Client) {
    super(client, {
      name: 'channel',
      aliases: ['채널설정'],
      description: 'channel command',
    });
  }

  runCommand = async (msg: ReceivedMessage, args: string[]) => {
    if (!msg.guild) return null;
    const [channel] = msg.getMentionedChannels();
    const member = await msg.guild.members.fetch(msg.author.id);
    if (!member?.permissions.has('ADMINISTRATOR'))
      return msg.respond('서버관리자만 공지 채널을 지정할 수 있습니다.');
    const prefix = getGuildPrefix(msg.guild);
    if (!channel) {
      const defaultChannel = await getDefaultChannel(msg.guild);
      if (!defaultChannel) return msg.respond('채널을 찾을 수 없습니다.');
      return msg.respond(stripIndents`
        현재 공지를 보내는 채널은 ${defaultChannel} 입니다.
        명령어 사용법 : \`${prefix}채널설정 #공지\`
      `);
    }
    if (!channel.isText()) {
      return msg.respond('채널이 잘못되었습니다.');
    }
    await Settings.updateOne(
      { _id: msg.guild.id },
      { $set: { channel: channel.id } },
      { upsert: true },
    );
    return msg.respond(
      `${channel}(이)가 전체공지를 띄울 채널로 설정되었습니다.`,
    );
  };
}
