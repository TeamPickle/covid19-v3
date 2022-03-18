import path from 'path';
import { Client, TextChannel, Options, Sweepers, Intents } from 'discord.js';
import config from '@src/config';
import createServer from '@src/web';
import Settings from './models/settingsModel';
import GuildPrefix from './structure/GuildPrefix';
import CommandBase from './structure/CommandBase';
import commandHandler from './event/commandHandler';
import initGuildPrefixHandler from './event/initGuildPrefixHandler';

const client = new Client({
  shards: 'auto',
  intents: [
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: {
      maxSize: 10,
    },
  }),
  sweepers: {
    messages: {
      interval: 60,
      filter: Sweepers.filterByLifetime({
        lifetime: 10,
        getComparisonTimestamp: (e) => e.editedTimestamp ?? e.createdTimestamp,
      }),
    },
  },
});

export const guildPrefix: GuildPrefix[] = [];
// eslint-disable-next-line import/no-mutable-exports
export let errorLogChannel: TextChannel;

const init = async () => {
  const settings = await Settings.find();
  settings.forEach((setting) => {
    if (!setting.prefix) return;
    guildPrefix.push(new GuildPrefix(setting));
  });

  errorLogChannel = (await client.channels.fetch(
    config.logChannelId,
  )) as TextChannel;
};

client
  .on('error', console.error)
  .on('warn', console.warn)
  .on('ready', () => {
    console.log(
      `Client ready; logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`,
    );
    init();
    createServer();
  })
  .on('disconnect', () => {
    console.warn('Disconnected!');
  })
  .on('shardReconnecting', () => {
    console.warn('Reconnecting...');
  })
  .on('messageCreate', commandHandler)
  .on('messageCreate', initGuildPrefixHandler);

export const commands = (() => {
  const commandsCollection: CommandBase[] = [];

  // eslint-disable-next-line global-require
  const obj = require('require-all')({
    filter: /^([^.].*)\.(js|ts)$/,
    dirname: path.join(__dirname, 'commands'),
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const group of Object.values(obj)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const cmd of Object.values(group as Object))
      if (typeof cmd.default === 'function') {
        const Cmd = cmd.default;
        commandsCollection.push(new Cmd(client));
      }
  }
  return commandsCollection;
})();

export default client;
