// ============================================
//  🖥️ Telegram Bot — Home Server Control Panel
//  Untuk Armbian B860H v1 (RAM 1GB)
//  RINGAN & AMAN
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { registerCommands } = require('./bot/commands');
const { registerCallbacks } = require('./bot/callbacks');
const { startScheduler } = require('./scheduler/cron');
const { sendMonitoring } = require('./modules/monitoring');

// ============================================
// Inisialisasi Bot (Long Polling — ringan)
// ============================================
process.env.NTBA_FIX_350 = '1';

const bot = new TelegramBot(config.botToken, {
  polling: {
    interval: 2000,       // Poll setiap 2 detik (hemat resource)
    autoStart: true,
    params: {
      timeout: 30,        // Long polling timeout 30 detik
    },
  },
  request: {
    agentOptions: {
      family: 4 // Force IPv4 untuk mencegah AggregateError di Node 18+ (karena STB sering tidak support IPv6 penuh)
    }
  }
});

console.log('');
console.log('🖥️  ================================');
console.log(`    ${config.hostname} Control Panel`);
console.log('    Telegram Bot v1.0.0');
console.log('  ================================');
console.log('');

// ============================================
// Register handlers
// ============================================
registerCommands(bot);
registerCallbacks(bot);

// ============================================
// Start cron scheduler (monitoring otomatis)
// ============================================
startScheduler(bot);

// ============================================
// Kirim notifikasi startup + monitoring pertama
// ============================================
(async () => {
  try {
    await bot.sendMessage(
      config.chatId,
      `🟢 *Bot ${config.hostname} telah aktif\\!*\n_Monitoring dimulai\\._`,
      { parse_mode: 'MarkdownV2' }
    );
    // Kirim monitoring pertama saat bot start
    await sendMonitoring(bot, config.chatId, config.hostname);
    console.log('✅ Bot berhasil start dan monitoring pertama terkirim');
  } catch (err) {
    console.error('❌ Gagal kirim pesan startup:', err.message);
  }
})();

// ============================================
// Error handling — jangan sampai crash!
// ============================================
bot.on('polling_error', (err) => {
  // Jangan crash karena network error, cukup log
  if (err.code === 'ETELEGRAM' || err.code === 'EFATAL') {
    console.error(`⚠️ Polling error: ${err.message}`);
  }
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  // Jangan exit, biar bot tetap jalan
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Bot dimatikan (SIGINT)');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Bot dimatikan (SIGTERM)');
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 Bot sedang berjalan... tekan Ctrl+C untuk stop');
