// ============================================
// Config loader — baca .env dan export config
// ============================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  botToken: process.env.BOT_TOKEN || '',
  chatId: process.env.CHAT_ID || '',
  hostname: process.env.HOSTNAME || 'Server',
  monitorCron: process.env.MONITOR_CRON || '*/10 * * * *',
};

// Validasi config
if (!config.botToken || config.botToken === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ BOT_TOKEN belum diisi! Edit file .env');
  process.exit(1);
}

if (!config.chatId || config.chatId === 'YOUR_CHAT_ID_HERE') {
  console.error('❌ CHAT_ID belum diisi! Edit file .env');
  process.exit(1);
}

module.exports = config;
