import {
  APIMessageContentResolvable, Collection, Guild, MessageAdditions, TextChannel,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import Autocalls from '../models/autocallModel';
import Settings from '../models/settingsModel';

export const getDefaultChannel = async (guild: Guild) => {
  const row = await Settings.findById(guild.id);
  if (row?.channel) {
    const channel = guild.channels.cache.get(row.channel);
    if (channel) return channel as TextChannel;
  }

  return (
    (guild.channels
      .cache
      .filter((channel) => (
        (<typeof channel.type[]>['text', 'news', 'store']).includes(channel.type)
          && !!guild.client.user
          && !!channel.permissionsFor(guild.client.user)?.has('VIEW_CHANNEL')
          && !!channel.permissionsFor(guild.client.user)?.has('SEND_MESSAGES')
      )) as Collection<string, TextChannel>)
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .first()
  );
};

const send = async (
  client: CommandoClient, content: APIMessageContentResolvable | MessageAdditions,
) => {
  let sended = 0;
  const hour = new Date().getHours();
  const autocalls = await Autocalls.find();

  await client.guilds.cache.reduce(async (acc, guild) => {
    await acc;
    const setting = await Settings.findById(guild.id);
    if (setting?.dnd && (hour < 7 || hour >= 22)) return;

    const channel = await getDefaultChannel(guild);
    if (!channel) return;
    await channel.send(content);
    sended += 1;
  }, Promise.resolve());

  await autocalls.reduce(async (acc, { _id }) => {
    await acc;
    const user = client.users.cache.get(_id);
    if (!user) return;
    await user.send(content);
    sended += 1;
  }, Promise.resolve());

  const toSendSize = client.guilds.cache.size + autocalls.length;
  return {
    toSendSize,
    sended,
  };
};

export default send;
