import { Snowflake } from 'discord.js';
import { Setting } from '@src/bot/models/settingsModel';

export default class GuildPrefix {
  id: Snowflake;

  prefix: string;

  constructor(g: Setting | { _id: string; prefix?: string }) {
    this.id = g._id;
    this.prefix = g.prefix || '!';
  }
}
