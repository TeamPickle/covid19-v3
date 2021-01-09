import path from 'path';
import { CommandoClient, CommandoGuild, FriendlyError } from 'discord.js-commando';
import { oneLine } from 'common-tags';
import { owner } from '@/config.json';
import Settings from './models/settingsModel';
import './tasks';

const client = new CommandoClient({
  shards: 'auto',
  owner,
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

client.on('error', console.error)
  .on('warn', console.warn)
  .on('debug', console.log)
  .on('ready', () => {
    console.log(`Client ready; logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`);
    init();
  })
  .on('disconnect', () => { console.warn('Disconnected!'); })
  .on('reconnecting', () => { console.warn('Reconnecting...'); })
  .on('commandError', (cmd, err) => {
    if (err instanceof FriendlyError) return;
    console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
  })
  .on('commandBlock', (msg, reason) => {
    console.log(oneLine`
      Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
      blocked; ${reason}
    `);
  })
  .on('commandPrefixChange', (guild, prefix) => {
    console.log(oneLine`
      Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
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
