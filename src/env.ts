import 'dotenv/config'

import { cleanEnv, num, str } from 'envalid'

export const env = cleanEnv(process.env, {
  TZ: str({ default: 'America/Sao_Paulo' }),
  HOST: str({ default: '0.0.0.0' }),
  PORT: num({ default: 3000 }),
  LOG_LEVEL: str({ default: 'info' }),
  NODE_ENV: str({ default: 'development' }),

  // Database

  // Discord
  DISC_USER_1_TOKEN: str({ default: '' }),
  DISC_GUILD_ID: str({ default: '' }),
  DISC_CHANNEL_ID: str({ default: '' }),
})
