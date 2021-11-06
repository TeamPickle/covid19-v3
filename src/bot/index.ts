import path from 'path';
import {
  Command,
  CommandoClient,
  CommandoGuild,
  CommandoMessage,
  FriendlyError,
} from 'discord.js-commando';
import { oneLine } from 'common-tags';
import config from '@src/config';
import createServer from '@src/web';
import Settings from './models/settingsModel';
import startTask from './tasks';

const client = new CommandoClient({
  shards: 'auto',
  owner: config.owner,
  messageCacheMaxSize: 10,
  messageCacheLifetime: 60,
});

const init = async () => {
  const settings = await Settings.find();
  settings.forEach((setting) => {
    if (!setting.prefix) return;
    const guild = client.guilds.cache.get(setting._id);
    if (!guild) return;
    (guild as CommandoGuild).commandPrefix = setting.prefix;
  });
};

client
  .on('error', console.error)
  .on('warn', console.warn)
  .on('debug', (m) => !m.toLowerCase().includes('heartbeat') && console.log(m))
  .on('ready', () => {
    console.log(
      `Client ready; logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`,
    );
    init();
    startTask();
    createServer();
  })
  .on('disconnect', () => {
    console.warn('Disconnected!');
  })
  .on('shardReconnecting', () => {
    console.warn('Reconnecting...');
  })
  .on('commandError', (cmd: Command, err: Error, ..._) => {
    if (err instanceof FriendlyError) return;
    console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
  })
  .on('commandBlock', (msg: CommandoMessage, reason: string, ..._) => {
    console.log(oneLine`
      Command ${
        msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''
      }
      blocked; ${reason}
    `);
  })
  .on('commandPrefixChange', (guild, prefix) => {
    console.log(oneLine`
      Prefix ${
        prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`
      }
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `);
  })
  .on('commandStatusChange', (guild, command, enabled) => {
    console.log(oneLine`
      Command ${command.groupID}:${command.memberName}
      ${enabled ? 'enabled' : 'disabled'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `);
  })
  .on('groupStatusChange', (guild, group, enabled) => {
    console.log(oneLine`
      Group ${group.id}
      ${enabled ? 'enabled' : 'disabled'}
      ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
    `);
  });

client.registry
  .registerDefaultGroups()
  .registerDefaultTypes()
  .registerCommandsIn({
    filter: /^([^.].*)\.(js|ts)$/,
    dirname: path.join(__dirname, 'commands'),
  });

export default client;
