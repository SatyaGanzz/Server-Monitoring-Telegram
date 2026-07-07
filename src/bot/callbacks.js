// ============================================
// Callback Handlers — handle inline keyboard clicks
// ============================================
const config = require('../config');
const docker = require('../modules/docker');
const admin = require('../modules/admin');
const { escMd } = require('../utils/formatter');

/**
 * Register callback query handler
 * @param {TelegramBot} bot
 */
function registerCallbacks(bot) {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    // Security: cek chat id
    if (String(chatId) !== config.chatId) {
      await bot.answerCallbackQuery(query.id, { text: '⛔ Akses ditolak' });
      return;
    }

    try {
      // ============================================
      // Docker callbacks
      // ============================================
      if (data === 'docker:refresh') {
        await bot.answerCallbackQuery(query.id, { text: '🔄 Refreshing...' });
        await bot.deleteMessage(chatId, messageId);
        await docker.handleDockerCommand(bot, chatId, config.hostname);
      }

      else if (data === 'docker:back') {
        await bot.answerCallbackQuery(query.id);
        await bot.deleteMessage(chatId, messageId);
        await docker.handleDockerCommand(bot, chatId, config.hostname);
      }

      else if (data.startsWith('docker:select:')) {
        const containerId = data.split(':')[2];
        await bot.answerCallbackQuery(query.id);
        await docker.handleContainerSelect(bot, chatId, messageId, containerId);
      }

      else if (data.startsWith('docker:start:')) {
        const containerId = data.split(':')[2];
        await bot.answerCallbackQuery(query.id, { text: '▶️ Starting...' });
        await docker.startContainer(containerId);
        // Refresh menu
        await docker.handleContainerSelect(bot, chatId, messageId, containerId);
      }

      else if (data.startsWith('docker:stop:')) {
        const containerId = data.split(':')[2];
        await bot.answerCallbackQuery(query.id, { text: '⏹ Stopping...' });
        await docker.stopContainer(containerId);
        await docker.handleContainerSelect(bot, chatId, messageId, containerId);
      }

      else if (data.startsWith('docker:restart:')) {
        const containerId = data.split(':')[2];
        await bot.answerCallbackQuery(query.id, { text: '🔄 Restarting...' });
        await docker.restartContainer(containerId);
        await docker.handleContainerSelect(bot, chatId, messageId, containerId);
      }

      else if (data.startsWith('docker:logs:')) {
        const containerId = data.split(':')[2];
        await bot.answerCallbackQuery(query.id, { text: '📋 Mengambil logs...' });
        const container = await docker.getContainer(containerId);
        const logs = await docker.getContainerLogs(containerId);

        const truncated = logs.length > 3500 ? '...\n' + logs.slice(-3500) : logs;
        const msg =
          `📋 *Logs — ${escMd(container?.name || containerId)}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `\`\`\`\n${escMd(truncated || 'Tidak ada log')}\n\`\`\``;

        await bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }

      else if (data.startsWith('docker:remove:')) {
        const containerId = data.split(':')[2];
        const container = await docker.getContainer(containerId);
        // Konfirmasi dulu
        await bot.answerCallbackQuery(query.id);
        await bot.editMessageText(
          `⚠️ *Yakin ingin HAPUS container* \`${escMd(container?.name || containerId)}\`*?*\n\n_Aksi ini tidak bisa dibatalkan\\!_`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Ya, Hapus', callback_data: `docker:remove_confirm:${containerId}` },
                  { text: '❌ Batal', callback_data: `docker:select:${containerId}` },
                ],
              ],
            },
          }
        );
      }

      else if (data.startsWith('docker:remove_confirm:')) {
        const containerId = data.split(':')[2];
        await bot.answerCallbackQuery(query.id, { text: '🗑 Menghapus...' });
        await docker.removeContainer(containerId);
        await bot.editMessageText('✅ Container berhasil dihapus\\.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'MarkdownV2',
        });
      }

      // ============================================
      // Admin callbacks
      // ============================================
      else if (data === 'adm:reboot') {
        await bot.answerCallbackQuery(query.id);
        await bot.editMessageText(
          `⚠️ *Yakin ingin REBOOT device?*\n\n_Server akan offline sementara\\._`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Ya, Reboot', callback_data: 'adm:reboot_confirm' },
                  { text: '❌ Batal', callback_data: 'adm:back' },
                ],
              ],
            },
          }
        );
      }

      else if (data === 'adm:reboot_confirm') {
        await bot.answerCallbackQuery(query.id);
        await bot.editMessageText('🔄 *Rebooting server\\.\\.\\.*\n\n_Server akan kembali online dalam beberapa saat\\._', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'MarkdownV2',
        });
        await admin.rebootDevice();
      }

      else if (data === 'adm:shutdown') {
        await bot.answerCallbackQuery(query.id);
        await bot.editMessageText(
          `🚨 *Yakin ingin SHUTDOWN device?*\n\n_Server akan mati total dan harus dinyalakan manual\\!_`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'MarkdownV2',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Ya, Shutdown', callback_data: 'adm:shutdown_confirm' },
                  { text: '❌ Batal', callback_data: 'adm:back' },
                ],
              ],
            },
          }
        );
      }

      else if (data === 'adm:shutdown_confirm') {
        await bot.answerCallbackQuery(query.id);
        await bot.editMessageText('⏻ *Shutting down\\.\\.\\.*\n\n_Goodbye\\! 👋_', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'MarkdownV2',
        });
        await admin.shutdownDevice();
      }

      else if (data === 'adm:ram') {
        await bot.answerCallbackQuery(query.id, { text: '📊 Mengecek RAM...' });
        const result = await admin.checkRam();
        const msg =
          `📊 *RAM Usage — ${escMd(config.hostname)}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `\`\`\`\n${escMd(result.output)}\n\`\`\``;
        await bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }

      else if (data === 'adm:docker_restart') {
        await bot.answerCallbackQuery(query.id, { text: '🐳 Restarting semua Docker...' });
        const results = await docker.restartAllContainers();
        const msg =
          `🐳 *Restart All Docker — ${escMd(config.hostname)}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          (results.length > 0 ? results.map((r) => escMd(r)).join('\n') : '_Tidak ada container yang running_');
        await bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }

      else if (data === 'adm:tailscale') {
        await bot.answerCallbackQuery(query.id, { text: '🔗 Mengecek Tailscale...' });
        const msg = await admin.checkTailscale();
        await bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }

      else if (data === 'adm:cloudflared') {
        await bot.answerCallbackQuery(query.id, { text: '☁️ Mengecek Cloudflared...' });
        const msg = await admin.checkCloudflared();
        await bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }

      else if (data === 'adm:speedtest') {
        await bot.answerCallbackQuery(query.id, { text: '🚀 Menjalankan Speedtest (butuh 30-60 detik)...' });
        // Send a temporary message because speedtest takes long
        const tempMsg = await bot.sendMessage(chatId, '🚀 *Speedtest sedang berjalan...*\n_Mohon tunggu sekitar 30-60 detik._', { parse_mode: 'MarkdownV2' });
        const result = await admin.checkSpeedtest();
        const msg =
          `🚀 *Speedtest Result — ${escMd(config.hostname)}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `\`\`\`\n${escMd(result)}\n\`\`\``;
        await bot.deleteMessage(chatId, tempMsg.message_id);
        await bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }

      else if (data === 'help:updatebot') {
        await bot.answerCallbackQuery(query.id, { text: '🔄 Mengupdate bot...' });
        await bot.sendMessage(chatId, '🔄 *Menarik update dari GitHub...*', { parse_mode: 'MarkdownV2' });
        
        const { exec } = require('child_process');
        exec('git pull', async (error, stdout, stderr) => {
          if (error) {
            await bot.sendMessage(chatId, `❌ *Gagal mengupdate bot:*\n\`\`\`\n${escMd(error.message)}\n\`\`\``, { parse_mode: 'MarkdownV2' });
          } else {
            const resultText = stdout.trim() || stderr.trim();
            await bot.sendMessage(chatId, `✅ *Update berhasil ditarik:*\n\`\`\`\n${escMd(resultText)}\n\`\`\`\n\n_Restarting bot dalam 2 detik..._`, { parse_mode: 'MarkdownV2' });
            
            // Tunggu pesan terkirim, lalu restart bot
            setTimeout(() => {
              exec('sudo systemctl restart tele-bot');
            }, 2000);
          }
        });
      }

      else if (data === 'adm:back') {
        await bot.answerCallbackQuery(query.id);
        await bot.deleteMessage(chatId, messageId);
        await admin.handleAdminCommand(bot, chatId, config.hostname);
      }

      else if (data === 'adm:close') {
        await bot.answerCallbackQuery(query.id, { text: '👋 Panel ditutup' });
        await bot.deleteMessage(chatId, messageId);
      }

    } catch (err) {
      console.error('❌ Callback error:', err.message);
      await bot.answerCallbackQuery(query.id, { text: `❌ Error: ${err.message}` });
    }
  });

  console.log('✅ Callback handlers registered');
}

module.exports = { registerCallbacks };
