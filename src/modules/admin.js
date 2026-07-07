// ============================================
// Admin Module — perintah administrasi server
// ============================================
const { exec } = require('child_process');
const { formatAdminPanel, escMd } = require('../utils/formatter');

/**
 * Jalankan shell command
 */
function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) resolve({ ok: false, output: stderr || err.message });
      else resolve({ ok: true, output: stdout.trim() });
    });
  });
}

/**
 * Handle /adm command — tampilkan admin panel
 */
async function handleAdminCommand(bot, chatId, hostname) {
  const message = formatAdminPanel(hostname);

  const keyboard = [
    [{ text: '🔄 Reboot Device', callback_data: 'adm:reboot' }],
    [{ text: '⏻ Shutdown Device', callback_data: 'adm:shutdown' }],
    [{ text: '📊 Cek RAM (free -h)', callback_data: 'adm:ram' }],
    [{ text: '🐳 Restart All Docker', callback_data: 'adm:docker_restart' }],
    [{ text: '🔗 Tailscale Status', callback_data: 'adm:tailscale' }],
    [{ text: '☁️ Cloudflared Status', callback_data: 'adm:cloudflared' }],
    [{ text: '🚀 Speedtest', callback_data: 'adm:speedtest' }],
    [{ text: '❌ Close', callback_data: 'adm:close' }],
  ];

  await bot.sendMessage(chatId, message, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * Reboot server (dengan delay 2 detik supaya pesan terkirim dulu)
 */
async function rebootDevice() {
  return run('sleep 2 && sudo reboot');
}

/**
 * Shutdown server
 */
async function shutdownDevice() {
  return run('sleep 2 && sudo shutdown now');
}

/**
 * Cek RAM usage (free -h)
 */
async function checkRam() {
  return run('free -h');
}

/**
 * Cek status Tailscale
 */
async function checkTailscale() {
  const status = await run('systemctl is-active tailscaled');
  const ip = await run('tailscale ip -4 2>/dev/null');

  let msg = '';
  if (status.ok && status.output === 'active') {
    msg = `🟢 *Tailscale:* Active\n`;
    if (ip.ok) msg += `🔗 IP: \`${escMd(ip.output)}\``;
  } else {
    msg = `🔴 *Tailscale:* Inactive`;
  }
  return msg;
}

/**
 * Cek status Cloudflared
 */
async function checkCloudflared() {
  const status = await run('systemctl is-active cloudflared');

  if (status.ok && status.output === 'active') {
    return `🟢 *Cloudflared:* Active`;
  }
  return `🔴 *Cloudflared:* Inactive`;
}

/**
 * Cek Speedtest
 */
async function checkSpeedtest() {
  // Using simple speedtest.py script for lightweight execution
  const result = await run('curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 - --simple');
  if (!result.ok || !result.output) return "❌ Gagal menjalankan speedtest. Pastikan curl & python3 terinstall.";
  return result.output;
}

module.exports = {
  handleAdminCommand,
  rebootDevice,
  shutdownDevice,
  checkRam,
  checkTailscale,
  checkCloudflared,
  checkSpeedtest,
};
