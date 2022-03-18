import { Client, Message } from 'discord.js';
import AbstractCommandBase, { CommandOptions } from './AbstractCommandBase';
import ReceivedMessage from './ReceivedMessage';

export default class CommandBase extends AbstractCommandBase {
  client: Client;

  constructor(client: Client, options: CommandOptions) {
    super(options);
    this.client = client;
  }

  async runCommand(
    msg: ReceivedMessage,
    args: string[],
  ): Promise<Message | Message[] | null> {
    throw new Error(
      `${this.commandOption.name}이(가) runCommand()를 구현하지 않습니다.`,
    );
  }
}
