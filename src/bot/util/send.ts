import {
  Client,
  Collection,
  Guild,
  MessageOptions,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import Autocalls from '../models/autocallModel';
import Settings from '../models/settingsModel';

export const getDefaultChannel = async (guild: Guild) => {
  const row = await Settings.findById(guild.id);
  if (row?.channel) {
    const channel = guild.channels.cache.get(row.channel);
    if (
      channel &&
      guild.client.user &&
      channel
        .permissionsFor(guild.client.user)
        ?.has([
          'VIEW_CHANNEL',
          'SEND_MESSAGES',
          'EMBED_LINKS',
          'USE_EXTERNAL_EMOJIS',
        ])
    ) {
      return channel as TextChannel;
    }
  }

  return (
    guild.channels.cache.filter(
      (channel) =>
        channel.isText() &&
        !!guild.client.user &&
        !!channel
          .permissionsFor(guild.client.user)
          ?.has([
            'VIEW_CHANNEL',
            'SEND_MESSAGES',
            'EMBED_LINKS',
            'USE_EXTERNAL_EMOJIS',
          ]),
    ) as Collection<string, TextChannel>
  )
    .sort((a, b) => a.rawPosition - b.rawPosition)
    .first();
};

const send = async (
  client: Client,
  content: MessagePayload | MessageOptions,
) => {
  let sended = 0;
  const hour = new Date().getHours();
  const autocalls = await Autocalls.find();

  await client.guilds.cache.reduce(async (acc, guild) => {
    await acc;
    const setting = await Settings.findById(guild.id);
    if (setting?.dnd && (hour < 7 || hour >= 22)) return;

    try {
      const channel = await getDefaultChannel(guild);
      if (!channel) return;
      try {
        await channel.send(content);
        sended += 1;
      } catch (e) {
        console.error(e);
        console.error(guild.id, channel.id);
      }
    } catch (e) {
      console.error(e);
      console.error(guild.id);
    }
  }, Promise.resolve());

  await autocalls.reduce(async (acc, { _id }) => {
    await acc;
    const user = client.users.cache.get(_id);
    if (!user) return;
    try {
      await user.send(content);
      sended += 1;
    } catch (e) {
      console.error(e);
      console.error(user.id);
    }
  }, Promise.resolve());

  const toSendSize = client.guilds.cache.size + autocalls.length;
  return {
    toSendSize,
    sended,
  };
};

export default send;
