// ============================================
// System Info — pakai Linux native commands
// RINGAN: tidak pakai library berat, langsung
// baca dari /proc dan command bawaan Linux
// ============================================
const { exec } = require('child_process');

/**
 * Jalankan shell command dan return hasilnya
 * @param {string} cmd - Command yang mau dijalankan
 * @returns {Promise<string>} - Output dari command
 */
function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 5000 }, (err, stdout) => {
      resolve(err ? 'N/A' : stdout.trim());
    });
  });
}

/**
 * Ambil uptime server dalam format yang readable
 */
async function getUptime() {
  const raw = await run('cat /proc/uptime');
  if (raw === 'N/A') return 'N/A';

  const totalSeconds = Math.floor(parseFloat(raw.split(' ')[0]));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(' ');
}

/**
 * Ambil CPU usage dari /proc/stat (snapshot 1 detik)
 */
async function getCpuUsage() {
  // Baca 2x dengan interval 1 detik untuk hitung perbedaan
  const read = async () => {
    const raw = await run('head -1 /proc/stat');
    const parts = raw.replace(/cpu\s+/, '').split(/\s+/).map(Number);
    const idle = parts[3];
    const total = parts.reduce((a, b) => a + b, 0);
    return { idle, total };
  };

  const first = await read();
  await new Promise((r) => setTimeout(r, 1000));
  const second = await read();

  const idleDiff = second.idle - first.idle;
  const totalDiff = second.total - first.total;

  if (totalDiff === 0) return '0%';
  return Math.round(((totalDiff - idleDiff) / totalDiff) * 100) + '%';
}

/**
 * Ambil suhu CPU
 */
async function getCpuTemp() {
  const raw = await run('cat /sys/class/thermal/thermal_zone0/temp');
  if (raw === 'N/A') return 'N/A';
  return (parseInt(raw) / 1000).toFixed(1) + '°C';
}

/**
 * Ambil info memory dari /proc/meminfo
 */
async function getMemory() {
  const raw = await run('cat /proc/meminfo');
  if (raw === 'N/A') return { used: 'N/A', total: 'N/A', percent: 'N/A' };

  const lines = raw.split('\n');
  const getValue = (key) => {
    const line = lines.find((l) => l.startsWith(key));
    return line ? parseInt(line.split(/\s+/)[1]) : 0;
  };

  const totalKB = getValue('MemTotal');
  const availableKB = getValue('MemAvailable');
  const usedKB = totalKB - availableKB;

  const totalMB = Math.round(totalKB / 1024);
  const usedMB = Math.round(usedKB / 1024);
  const percent = Math.round((usedKB / totalKB) * 100);

  return { used: `${usedMB}MB`, total: `${totalMB}MB`, percent: `${percent}%` };
}

/**
 * Ambil info disk/storage dari df
 */
async function getStorage() {
  const raw = await run('df -h --output=target,size,used,avail,pcent -x tmpfs -x devtmpfs -x overlay 2>/dev/null || df -h');
  if (raw === 'N/A') return [];

  const lines = raw.split('\n').slice(1); // skip header
  const disks = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) {
      const mount = parts[0];
      // Filter hanya mount point yang relevan
      if (mount === '/' || mount.startsWith('/mnt') || mount.startsWith('/media')) {
        disks.push({
          mount,
          size: parts[1],
          used: parts[2],
          avail: parts[3],
          percent: parts[4],
        });
      }
    }
  }

  return disks;
}

/**
 * Ambil network stats (total bandwidth sejak boot)
 */
async function getNetwork() {
  const raw = await run('cat /proc/net/dev');
  if (raw === 'N/A') return { upload: 'N/A', download: 'N/A' };

  const lines = raw.split('\n').slice(2); // skip 2 header lines
  let totalRx = 0;
  let totalTx = 0;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 10) {
      const iface = parts[0].replace(':', '');
      // Skip loopback
      if (iface === 'lo') continue;
      totalRx += parseInt(parts[1]) || 0;
      totalTx += parseInt(parts[9]) || 0;
    }
  }

  return {
    upload: formatBytes(totalTx),
    download: formatBytes(totalRx),
  };
}

/**
 * Ambil IP address
 */
async function getIpAddress() {
  const raw = await run("hostname -I 2>/dev/null | awk '{print $1}'");
  return raw || 'N/A';
}

/**
 * Format bytes ke human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

module.exports = {
  getUptime,
  getCpuUsage,
  getCpuTemp,
  getMemory,
  getStorage,
  getNetwork,
  getIpAddress,
};
