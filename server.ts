import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Send Email via Resend
  app.post("/api/send-email", async (req, res) => {
    const { to, bcc, subject, html } = req.body;

    if (!process.env.RESEND_API_KEY) {
      return res
        .status(500)
        .json({
          error: "RESEND_API_KEY belum dikonfigurasi di environment variables.",
        });
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailPayload: any = {
        from: "Portal Skor <noreply@portalskor.net>", // Pastikan domain portalskor.net sudah diverifikasi di dashboard Resend
        to,
        subject,
        html,
      };

      if (bcc) {
        emailPayload.bcc = bcc;
      }

      const { data, error } = await resend.emails.send(emailPayload);

      if (error) throw error;
      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Resend error:", err);
      res.status(500).json({ error: err.message || "Gagal mengirim email" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
