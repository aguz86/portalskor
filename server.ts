import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cron from "node-cron";
import { getScheduleForDate } from "./src/data/schedule.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Background Cron Job for Telegram Notification
  cron.schedule('* * * * *', async () => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId || botToken === "MY_TELEGRAM_BOT_TOKEN" || chatId === "MY_TELEGRAM_CHAT_ID") {
      return; // Skip if credentials are not configured
    }

    const now = new Date();
    // Gunakan timezone Asia/Jakarta
    const currentHhMm = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

    const currentScheduleData = getScheduleForDate(now);
    const currentItem = currentScheduleData.find(item => item.start === currentHhMm);
    
    if (currentItem) {
      try {
        const typeStr = currentItem.isBreak ? "☕ JEDA" : "🚀 SESI FOKUS";
        let message = `*SESI BARU DIMULAI*\n\n`;
        message += `Tipe: ${typeStr}\n`;
        message += `Aktivitas: *${currentItem.activity}*\n`;
        message += `Waktu: ${currentItem.start} - ${currentItem.end}\n`;
        message += `Durasi: ${currentItem.duration} menit\n\n`;
        message += `_Catatan: ${currentItem.notes}_`;

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });

        if (!response.ok) {
          console.error(`Telegram API responded with ${response.status}`);
        } else {
          console.log(`Telegram notification sent for ${currentItem.activity} at ${currentHhMm}`);
        }
      } catch (error) {
        console.error("Telegram cron notification error:", error);
      }
    }
  }, {
    timezone: "Asia/Jakarta"
  });

  // API Route for testing Telegram Notification or from frontend
  app.post("/api/telegram", async (req, res) => {
    const { activity, duration, isBreak, notes } = req.body;
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId || botToken === "MY_TELEGRAM_BOT_TOKEN" || chatId === "MY_TELEGRAM_CHAT_ID") {
      res.status(500).json({ error: "Telegram credentials not configured." });
      return;
    }

    try {
      const typeStr = isBreak ? "☕ JEDA" : "🚀 SESI FOKUS";
      let message = `*SESI BARU DIMULAI*\n\n`;
      message += `Tipe: ${typeStr}\n`;
      message += `Aktivitas: *${activity}*\n`;
      message += `Durasi: ${duration} menit\n\n`;
      message += `_Catatan: ${notes}_`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API responded with ${response.status}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Telegram notification error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
