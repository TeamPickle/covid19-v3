/* global NodeJS */
import mongoose from 'mongoose';
import config from '@src/config';
import bot from './bot';

mongoose.connect(config.db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

bot.login(config.token);

const shutdown = (signal: NodeJS.Signals) => {
  console.log(signal);
  bot.destroy();
  process.exit(0);
};

(<NodeJS.Signals[]>['SIGINT', 'SIGTERM', 'SIGUSR2']).forEach((signal) => {
  process.on(signal, shutdown);
});
