import path from 'path';
import { CommandoClient, FriendlyError } from 'discord.js-commando';
import { oneLine } from 'common-tags';

const client = new CommandoClient({
  shards: 'auto',
});

client.on('error', console.error)
  .on('warn', console.warn)
  .on('debug', console.log)
  .on('ready', () => {
    console.log(`Client ready; logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`);
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
