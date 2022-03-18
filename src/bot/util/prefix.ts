import { Guild } from 'discord.js';
import { guildPrefix } from '..';
import GuildPrefix from '../structure/GuildPrefix';

export const getGuildPrefix = (guild?: Guild | null) =>
  guild ? guildPrefix.find((g) => g.id === guild.id)?.prefix || '!' : '!';

export const setGuildPrefix = (guild: Guild, prefix = '!') => {
  const gp = guildPrefix.find((g) => g.id === guild.id);
  if (!gp) {
    guildPrefix.push(new GuildPrefix({ _id: guild.id, prefix }));
    return;
  }
  gp.prefix = prefix;
};
