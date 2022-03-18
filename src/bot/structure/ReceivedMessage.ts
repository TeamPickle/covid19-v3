import {
  CommandInteraction,
  DMChannel,
  Guild,
  GuildMember,
  Message,
  MessageOptions,
  NewsChannel,
  Snowflake,
  TextChannel,
  ThreadChannel,
  User,
} from 'discord.js';
import { guildPrefix } from '..';

type ReceivedChannel = TextChannel | ThreadChannel | NewsChannel | DMChannel;

export default class ReceivedMessage {
  origin: Message | CommandInteraction;

  id: Snowflake;

  author: User;

  guild: Guild | null;

  channel: ReceivedChannel;

  prefix: string;

  constructor(m: Message | CommandInteraction) {
    this.origin = m;
    this.id = m.id;
    this.author = m instanceof Message ? m.author : m.user;
    this.guild = m.guild;
    this.channel = m.channel as ReceivedChannel;
    this.prefix = guildPrefix.find((g) => g.id === m.guild?.id)?.prefix ?? '.';
  }

  async respond(options: MessageOptions | string): Promise<Message> {
    if (this.origin instanceof Message) return this.origin.reply(options);
    if (typeof options === 'string')
      return this.origin.reply({
        content: options,
        fetchReply: true,
      }) as Promise<Message>;
    return this.origin.reply({
      ...options,
      fetchReply: true,
    }) as Promise<Message>;
  }

  getMentionedChannels(): ReceivedChannel[] {
    if (this.origin instanceof Message)
      return this.origin.mentions.channels.map((ch) => ch) as ReceivedChannel[];
    return this.origin.options.data
      .map((ch) => ch)
      .filter((o) => o.channel)
      .map((o) => o.channel as ReceivedChannel);
  }

  getMentiondMembers(): GuildMember[] {
    if (this.origin instanceof Message)
      return this.origin.mentions.members
        ? this.origin.mentions.members.map((m) => m)
        : [];
    return this.origin.options.data
      .map((m) => m)
      .filter((o) => o.member)
      .map((o) => o.member as GuildMember);
  }
}
