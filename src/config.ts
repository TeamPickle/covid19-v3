import dotenv from 'dotenv';

dotenv.config();

class ConfigError extends Error {
  constructor(key: string) {
    super();
    this.message = `${key} is not provided`;
  }
}

const config = {
  token: process.env.TOKEN!!,
  db: process.env.DB!!,
  owner: process.env.OWNER?.split(/[, ]/) ?? [],
  graphChannelId: process.env.GRAPH_CHANNEL_ID!!,
  logChannelId: process.env.LOG_CHANNEL_ID!!,
  corsAllow: process.env.CORS_ALLOW?.split(/[, ]/) ?? [],
  openApiKey: process.env.OPEN_API_KEY!!,
};

if (!config.token) throw new ConfigError('TOKEN');
if (!config.db) throw new ConfigError('DB');
if (!config.graphChannelId) throw new ConfigError('GRAPH_CHANNEL_ID');
if (!config.logChannelId) throw new ConfigError('LOG_CHANNEL_ID');
if (!config.openApiKey) throw new ConfigError('OPEN_API_KEY');

export default config;
