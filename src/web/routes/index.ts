import client from '@src/bot';
import Autocalls from '@src/bot/models/autocallModel';
import { Router } from 'express';
import expressAsyncHandler from 'express-async-handler';

const router = Router();

router.get('/status', expressAsyncHandler(async (req, res) => {
  return res.json({
    guildSize: client.guilds.cache.size,
    channelSize: client.channels.cache.size,
    memberSize: client.guilds.cache.reduce((prev, curr) => prev + curr.memberCount, 0),
    autocallSize: (await Autocalls.find({})).length,
    userSize: client.users.cache.size,
    uptime: client.uptime,
    readyAt: client.readyAt,
  });
}));

export default router;
