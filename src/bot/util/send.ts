import { APIMessageContentResolvable, Collection, Guild, MessageAdditions, TextChannel } from 'discord.js';
import { CommandoClient } from "discord.js-commando";

const getDefaultChannel = (guild: Guild) => (
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

const send = (client: CommandoClient, content: APIMessageContentResolvable | MessageAdditions) => {
  client.guilds.cache.forEach((guild) => {
    const channel = getDefaultChannel(guild);
    if (!channel) return;
    channel.send(content);
  });
};

export default send;
