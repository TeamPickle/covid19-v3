import Settings from '@src/bot/models/settingsModel';
import { getDefaultChannel } from '@src/bot/util/send';
import { stripIndents } from 'common-tags';
import { Channel } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';

export default class ChannelCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: 'channel',
      aliases: ['채널설정'],
      description: 'channel command',
      group: 'util',
      memberName: 'channel',
      guildOnly: true,
      argsPromptLimit: 0,
      args: [{
        key: 'channel',
        type: 'channel',
        prompt: '',
        default: '',
      }],
    });
  }

  run = async (msg: CommandoMessage, { channel }: { channel: Channel }) => {
    msg.author.tag
    if (!msg.member.permissions.has('ADMINISTRATOR')) return msg.channel.send('서버관리자만 공지 채널을 지정할 수 있습니다.');
    if (!channel) {
      const defaultChannel = await getDefaultChannel(msg.guild);
      if (!defaultChannel) return msg.channel.send('채널을 찾을 수 없습니다.');
      return msg.channel.send(stripIndents`
        현재 공지를 보내는 채널은 ${defaultChannel} 입니다.
        명령어 사용법 : \`${msg.guild.commandPrefix}채널설정 #공지\`
      `);
    }
    if (!(<Channel['type'][]>['text', 'news', 'store']).includes(channel.type)) {
      return msg.channel.send('채널이 잘못되었습니다.');
    }
    await Settings.updateOne({ _id: msg.guild.id }, { $set: { channel: channel.id }}, { upsert: true });
    return msg.channel.send(`${channel}(이)가 전체공지를 띄울 채널로 설정되었습니다.`);
  }
}
