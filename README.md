# 🖥️ Telegram Bot — Home Server Control Panel

Bot Telegram untuk monitoring dan manage Armbian B860H home server.

## Fitur

- 📊 **Monitoring otomatis** setiap 10 menit (CPU, RAM, disk, network, Docker)
- 🐳 **Docker Management** — start/stop/restart/logs container via Telegram
- ⚙️ **Admin Panel** — reboot, shutdown, cek RAM, Tailscale, Cloudflared

## Cara Install di Server

### 1. Copy file ke server

```bash
# Dari komputer lokal, SCP ke server
scp -r . root@<IP_SERVER>:/opt/tele-notify-bot/
```

### 2. Install dependencies

```bash
cd /opt/tele-notify-bot
npm install --production
```

### 3. Setup .env

```bash
cp .env.example .env
nano .env
```

Isi `BOT_TOKEN` dan `CHAT_ID` Anda.

### 4. Test jalankan manual

```bash
node src/index.js
```

Jika berhasil, Anda akan menerima pesan monitoring di Telegram.

### 5. Install sebagai systemd service (auto-start)

```bash
sudo cp tele-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tele-bot
sudo systemctl start tele-bot
```

### 6. Cek status

```bash
sudo systemctl status tele-bot
sudo journalctl -u tele-bot -f
```

## Commands

| Command | Fungsi |
|---------|--------|
| `/start` | Welcome message |
| `/status` | Manual monitoring |
| `/docker` | Docker management |
| `/adm` | Admin panel |
| `/ping` | Health check |
| `/help` | Bantuan |

## Cara Dapatkan Chat ID

1. Buka Telegram, cari **@userinfobot**
2. Kirim `/start`
3. Bot akan membalas dengan Chat ID Anda
