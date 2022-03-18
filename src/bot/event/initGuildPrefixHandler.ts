import { Message } from 'discord.js';
import Settings from '@src/bot/models/settingsModel';
import { guildPrefix } from '..';

const initGuildPrefixHandler = async (msg: Message) => {
  if (msg.content !== '.접두사초기화') return;
  if (!msg.guild) {
    msg.channel.send('서버에서 사용 가능한 명령어입니다.');
    return;
  }
  if (msg.channel.type !== 'GUILD_NEWS' && msg.channel.type !== 'GUILD_TEXT')
    return;

  if (!msg.channel.permissionsFor(msg.author.id)?.has(['ADMINISTRATOR'])) {
    msg.channel.send('서버관리자만 접두사를 변경할 수 있습니다.');
    return;
  }

  msg.channel.send({
    embeds: [
      {
        title: '접두사 초기화 완료',
        description:
          '접두사를 초기화 했습니다. ``!도움``과 같이 사용하실 수 있습니다.',
      },
    ],
  });

  await Settings.findByIdAndUpdate(
    msg.guild.id,
    {
      $set: {
        prefix: '.',
      },
    },
    { upsert: true },
  );

  const pg = guildPrefix.find((g) => g.id === msg.guild?.id);
  if (!pg) return;

  pg.prefix = '!';
};

export default initGuildPrefixHandler;
