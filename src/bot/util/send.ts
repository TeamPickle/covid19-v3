import { APIMessageContentResolvable, Collection, Guild, MessageAdditions, TextChannel } from 'discord.js';
import { CommandoClient } from "discord.js-commando";
import Channels from '../models/channelModel';
import Dnds from '../models/dndModel';

export const getDefaultChannel = async (guild: Guild) => {
  const row = await Channels.findById(guild.id);
  if (row) {
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

const send = async (client: CommandoClient, content: APIMessageContentResolvable | MessageAdditions) => {
  client.guilds.cache.forEach(async (guild) => {
    const hour = new Date().getHours();
    if (hour < 7 || hour >= 22) {
      const dnd = await Dnds.findById(guild.id);
      if (dnd) return;
    }
    const channel = await getDefaultChannel(guild);
    if (!channel) return;
    channel.send(content);
  });
};

export default send;
