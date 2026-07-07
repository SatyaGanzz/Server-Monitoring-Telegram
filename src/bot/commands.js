// ============================================
// Command Handlers — register /start, /docker, /adm, /status
// ============================================
const config = require('../config');
const { sendMonitoring } = require('../modules/monitoring');
const { handleDockerCommand } = require('../modules/docker');
const { handleAdminCommand } = require('../modules/admin');
const { escMd } = require('../utils/formatter');

/**
 * Register semua bot commands
 * @param {TelegramBot} bot
 */
function registerCommands(bot) {
  // /start — welcome message
  bot.onText(/\/start/, (msg) => {
    if (String(msg.chat.id) !== config.chatId) return;

    const welcome =
      `🖥️ *Selamat datang di ${escMd(config.hostname)} Control Panel\\!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Berikut command yang tersedia:\n\n` +
      `📊 /status — Cek monitoring sekarang\n` +
      `🐳 /docker — Manage Docker containers\n` +
      `⚙️ /adm — Admin panel\n` +
      `❓ /help — Bantuan\n\n` +
      `_Monitoring otomatis berjalan setiap 10 menit\\._`;

    bot.sendMessage(msg.chat.id, welcome, { parse_mode: 'MarkdownV2' });
  });

  // /help — bantuan
  bot.onText(/\/help/, (msg) => {
    if (String(msg.chat.id) !== config.chatId) return;

    const help =
      `❓ *Bantuan — ${escMd(config.hostname)}*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*Commands:*\n` +
      `📊 /status — Manual monitoring \\(tidak perlu tunggu 10 menit\\)\n` +
      `🐳 /docker — Lihat dan manage Docker containers\n` +
      `⚙️ /adm — Panel administrasi \\(reboot, shutdown, dll\\)\n` +
      `🏓 /ping — Cek apakah bot masih hidup\n\n` +
      `*Monitoring otomatis:*\n` +
      `Bot akan mengirim laporan sistem setiap 10 menit secara otomatis\\.`;

    bot.sendMessage(msg.chat.id, help, { parse_mode: 'MarkdownV2' });
  });

  // /status — manual trigger monitoring
  bot.onText(/\/status/, (msg) => {
    if (String(msg.chat.id) !== config.chatId) return;
    sendMonitoring(bot, msg.chat.id, config.hostname);
  });

  // /docker — docker management
  bot.onText(/\/docker/, (msg) => {
    if (String(msg.chat.id) !== config.chatId) return;
    handleDockerCommand(bot, msg.chat.id, config.hostname);
  });

  // /adm — admin panel
  bot.onText(/\/adm/, (msg) => {
    if (String(msg.chat.id) !== config.chatId) return;
    handleAdminCommand(bot, msg.chat.id, config.hostname);
  });

  // /ping — quick health check
  bot.onText(/\/ping/, (msg) => {
    if (String(msg.chat.id) !== config.chatId) return;
    bot.sendMessage(msg.chat.id, '🏓 *Pong\\!* Bot aktif dan berjalan\\.', {
      parse_mode: 'MarkdownV2',
    });
  });

  // Set command list di Telegram
  bot.setMyCommands([
    { command: 'start', description: '🏠 Welcome & daftar command' },
    { command: 'status', description: '📊 Cek monitoring sekarang' },
    { command: 'docker', description: '🐳 Manage Docker containers' },
    { command: 'adm', description: '⚙️ Admin panel' },
    { command: 'ping', description: '🏓 Cek bot hidup' },
    { command: 'help', description: '❓ Bantuan' },
  ]);

  console.log('✅ Commands registered: /start /status /docker /adm /ping /help');
}

module.exports = { registerCommands };
