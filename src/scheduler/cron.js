// ============================================
// Cron Scheduler — monitoring setiap 10 menit
// ============================================
const cron = require('node-cron');
const config = require('../config');
const { sendMonitoring } = require('../modules/monitoring');

/**
 * Start cron scheduler
 * @param {TelegramBot} bot
 */
function startScheduler(bot) {
  const cronExpr = config.monitorCron;

  if (!cron.validate(cronExpr)) {
    console.error(`❌ Cron expression tidak valid: ${cronExpr}`);
    return;
  }

  cron.schedule(cronExpr, () => {
    console.log(`[${new Date().toLocaleTimeString()}] ⏰ Cron triggered — kirim monitoring`);
    sendMonitoring(bot, config.chatId, config.hostname);
  });

  console.log(`✅ Scheduler started: monitoring setiap ${cronExpr}`);
}

module.exports = { startScheduler };
