import client from '@src/bot';
import { Router } from 'express';

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    guildCounts: client.guilds.cache.size,
  });
});

export default router;
