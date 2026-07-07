// ============================================
// Monitoring Module — kumpulkan data sistem
// dan kirim ke Telegram
// ============================================
const sysInfo = require('../utils/systemInfo');
const { formatMonitoring } = require('../utils/formatter');
const docker = require('./docker');

/**
 * Kumpulkan semua data monitoring dan kirim ke chat
 * @param {TelegramBot} bot - Instance bot
 * @param {string} chatId - Chat ID tujuan
 * @param {string} hostname - Nama server
 */
async function sendMonitoring(bot, chatId, hostname) {
  try {
    // Kumpulkan semua data secara paralel (kecuali CPU yang butuh 1 detik)
    const [uptime, cpuTemp, memory, storage, network, ip, containers] = await Promise.all([
      sysInfo.getUptime(),
      sysInfo.getCpuTemp(),
      sysInfo.getMemory(),
      sysInfo.getStorage(),
      sysInfo.getNetwork(),
      sysInfo.getIpAddress(),
      docker.listContainers(),
    ]);

    // CPU usage perlu 1 detik sampling, jalankan terpisah
    const cpu = await sysInfo.getCpuUsage();

    const message = formatMonitoring({
      hostname,
      uptime,
      cpu,
      cpuTemp,
      memory,
      storage,
      network,
      ip,
      containers,
    });

    await bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Monitoring terkirim`);
  } catch (err) {
    console.error('❌ Gagal kirim monitoring:', err.message);
  }
}

module.exports = { sendMonitoring };
