/* global NodeJS */
import mongoose from 'mongoose';
import { token, db } from '@/config.json';
import bot from './bot';

mongoose.connect(
  db,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
);

bot.login(token);

const shutdown = (signal: NodeJS.Signals) => {
  console.log(signal);
  bot.destroy();
  process.exit(0);
};

(<NodeJS.Signals[]>['SIGINT', 'SIGTERM', 'SIGUSR2']).forEach((signal) => {
  process.on(signal, shutdown);
});
