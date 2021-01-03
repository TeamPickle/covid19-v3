/* global NodeJS */
import { token } from '@/config.json';
import bot from './bot';

bot.login(token);

const shutdown = (signal: NodeJS.Signals) => {
  // eslint-disable-next-line no-console
  console.log(signal);
  bot.destroy();
  process.exit(0);
};

(<NodeJS.Signals[]>['SIGINT', 'SIGTERM', 'SIGUSR2']).forEach((signal) => {
  process.on(signal, shutdown);
});
