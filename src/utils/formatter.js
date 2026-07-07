// ============================================
// Formatter — template pesan Telegram yang keren
// ============================================

/**
 * Format pesan monitoring utama
 */
function formatMonitoring({ hostname, uptime, cpu, cpuTemp, memory, storage, network, ip, containers }) {
  const now = new Date().toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let msg = '';
  msg += `🖥️ *SERVER MONITOR — ${escMd(hostname)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // System
  msg += `⏱ *Uptime:* ${escMd(uptime)}\n`;
  msg += `🔥 *CPU:* ${escMd(cpu)} \\| ${escMd(cpuTemp)}\n`;
  msg += `💾 *RAM:* ${escMd(memory.used)} / ${escMd(memory.total)} \\(${escMd(memory.percent)}\\)\n\n`;

  // Storage
  msg += `💽 *Storage*\n`;
  if (storage.length === 0) {
    msg += `└─ _Tidak ada data_\n`;
  } else {
    storage.forEach((disk, i) => {
      const prefix = i === storage.length - 1 ? '└─' : '├─';
      msg += `${prefix} \`${disk.mount}\`: ${escMd(disk.used)} / ${escMd(disk.size)} \\(${escMd(disk.percent)}\\)\n`;
    });
  }
  msg += `\n`;

  // Network
  msg += `🌐 *Network \\(Total Akumulasi\\)*\n`;
  msg += `├─ ⬆️ Total Upload: ${escMd(network.upload)}\n`;
  msg += `├─ ⬇️ Total Download: ${escMd(network.download)}\n`;
  msg += `└─ 🔗 IP: \`${escMd(ip)}\`\n\n`;

  // Docker
  msg += `🐳 *Docker*\n`;
  if (containers.length === 0) {
    msg += `└─ _Tidak ada container_\n`;
  } else {
    containers.forEach((c, i) => {
      const prefix = i === containers.length - 1 ? '└─' : '├─';
      const icon = c.running ? '🟢' : '🔴';
      msg += `${prefix} ${icon} ${escMd(c.name)}\n`;
    });
  }
  msg += `\n`;

  msg += `⏰ _${escMd(now)} WIB_`;

  return msg;
}

/**
 * Format daftar docker untuk command /docker
 */
function formatDockerList(hostname, containers) {
  let msg = '';
  msg += `🐳 *Docker Manager — ${escMd(hostname)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (containers.length === 0) {
    msg += `_Tidak ada container Docker_`;
    return msg;
  }

  containers.forEach((c) => {
    const icon = c.running ? '🟢' : '🔴';
    const status = c.running ? 'Running' : 'Stopped';
    msg += `${icon} *${escMd(c.name)}* — _${escMd(status)}_\n`;
  });

  msg += `\n_Pilih container untuk manage:_`;
  return msg;
}

/**
 * Format sub-menu docker container
 */
function formatDockerDetail(container) {
  let msg = '';
  const icon = container.running ? '🟢' : '🔴';
  const status = container.running ? 'Running' : 'Stopped';
  msg += `🐳 *${escMd(container.name)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `Status: ${icon} _${escMd(status)}_\n`;
  msg += `Image: \`${escMd(container.image)}\`\n\n`;
  msg += `_Pilih aksi:_`;
  return msg;
}

/**
 * Format admin panel
 */
function formatAdminPanel(hostname) {
  let msg = '';
  msg += `⚙️ *Admin Panel — ${escMd(hostname)}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `_Pilih aksi yang ingin dilakukan:_`;
  return msg;
}

/**
 * Escape karakter khusus MarkdownV2
 */
function escMd(text) {
  if (text === null || text === undefined) return 'N/A';
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

module.exports = {
  formatMonitoring,
  formatDockerList,
  formatDockerDetail,
  formatAdminPanel,
  escMd,
};
