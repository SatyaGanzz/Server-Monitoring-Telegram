// ============================================
// Docker Module — manage Docker containers
// via Docker Engine API (socket)
// ============================================
const Docker = require('dockerode');
const { formatDockerList, formatDockerDetail, escMd } = require('../utils/formatter');

// Koneksi ke Docker via unix socket
const dockerClient = new Docker({ socketPath: '/var/run/docker.sock' });

/**
 * Cek apakah Docker daemon bisa diakses
 */
async function isDockerAvailable() {
  try {
    await dockerClient.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * List semua containers (running & stopped)
 * @returns {Array<{id, name, image, running, state}>}
 */
async function listContainers() {
  try {
    const containers = await dockerClient.listContainers({ all: true });
    return containers.map((c) => ({
      id: c.Id.substring(0, 12),
      name: c.Names[0].replace(/^\//, ''),
      image: c.Image,
      running: c.State === 'running',
      state: c.State,
    }));
  } catch {
    return [];
  }
}

/**
 * Ambil info container tertentu
 */
async function getContainer(containerId) {
  const containers = await listContainers();
  return containers.find((c) => c.id === containerId) || null;
}

/**
 * Start container
 */
async function startContainer(containerId) {
  const container = dockerClient.getContainer(containerId);
  await container.start();
}

/**
 * Stop container
 */
async function stopContainer(containerId) {
  const container = dockerClient.getContainer(containerId);
  await container.stop({ t: 10 });
}

/**
 * Restart container
 */
async function restartContainer(containerId) {
  const container = dockerClient.getContainer(containerId);
  await container.restart({ t: 10 });
}

/**
 * Ambil logs container (50 baris terakhir)
 */
async function getContainerLogs(containerId) {
  const container = dockerClient.getContainer(containerId);
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail: 30,
    timestamps: false,
  });

  // Docker logs punya 8-byte header per line, kita strip itu
  return logs
    .toString('utf8')
    .split('\n')
    .map((line) => {
      // Strip 8-byte Docker log header jika ada
      if (line.length > 8) {
        const stripped = line.substring(8);
        // Cek apakah hasil strip masih readable
        if (/^[\x20-\x7E\s]/.test(stripped)) return stripped;
      }
      return line;
    })
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

/**
 * Remove container (force)
 */
async function removeContainer(containerId) {
  const container = dockerClient.getContainer(containerId);
  await container.remove({ force: true });
}

/**
 * Restart semua running containers
 */
async function restartAllContainers() {
  const containers = await listContainers();
  const running = containers.filter((c) => c.running);
  const results = [];

  for (const c of running) {
    try {
      await restartContainer(c.id);
      results.push(`✅ ${c.name}`);
    } catch (err) {
      results.push(`❌ ${c.name}: ${err.message}`);
    }
  }

  return results;
}

// ============================================
// Telegram Handlers
// ============================================

/**
 * Handle /docker command — tampilkan daftar container
 */
async function handleDockerCommand(bot, chatId, hostname) {
  const available = await isDockerAvailable();
  if (!available) {
    await bot.sendMessage(chatId, '❌ Docker daemon tidak bisa diakses\\!', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  const containers = await listContainers();
  const message = formatDockerList(hostname, containers);

  // Buat inline keyboard — 2 container per baris
  const keyboard = [];
  for (let i = 0; i < containers.length; i += 2) {
    const row = [{ text: containers[i].name, callback_data: `docker:select:${containers[i].id}` }];
    if (containers[i + 1]) {
      row.push({ text: containers[i + 1].name, callback_data: `docker:select:${containers[i + 1].id}` });
    }
    keyboard.push(row);
  }

  // Tambah tombol refresh
  keyboard.push([{ text: '🔄 Refresh', callback_data: 'docker:refresh' }]);

  await bot.sendMessage(chatId, message, {
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * Handle ketika user pilih container — tampilkan sub-menu
 */
async function handleContainerSelect(bot, chatId, messageId, containerId) {
  const container = await getContainer(containerId);
  if (!container) {
    await bot.answerCallbackQuery({ text: '❌ Container tidak ditemukan' });
    return;
  }

  const message = formatDockerDetail(container);

  const keyboard = [];
  // Start/Stop tergantung status
  if (container.running) {
    keyboard.push([
      { text: '⏹ Stop', callback_data: `docker:stop:${containerId}` },
      { text: '🔄 Restart', callback_data: `docker:restart:${containerId}` },
    ]);
  } else {
    keyboard.push([
      { text: '▶️ Start', callback_data: `docker:start:${containerId}` },
    ]);
  }

  keyboard.push([{ text: '📋 Logs', callback_data: `docker:logs:${containerId}` }]);
  keyboard.push([{ text: '🗑 Remove', callback_data: `docker:remove:${containerId}` }]);
  keyboard.push([{ text: '⬅️ Kembali', callback_data: 'docker:back' }]);

  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'MarkdownV2',
    reply_markup: { inline_keyboard: keyboard },
  });
}

module.exports = {
  listContainers,
  getContainer,
  startContainer,
  stopContainer,
  restartContainer,
  getContainerLogs,
  removeContainer,
  restartAllContainers,
  isDockerAvailable,
  handleDockerCommand,
  handleContainerSelect,
};
