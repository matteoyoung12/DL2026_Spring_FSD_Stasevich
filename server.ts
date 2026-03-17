import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("qrcraft.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS qr_codes (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    scan_count INTEGER DEFAULT 0,
    favorite INTEGER DEFAULT 0,
    note TEXT
  );
`);

// Add missing columns for existing databases
try {
  db.exec("ALTER TABLE qr_codes ADD COLUMN favorite INTEGER DEFAULT 0");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE qr_codes ADD COLUMN note TEXT");
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Save QR Code
  app.post("/api/qr", (req, res) => {
    const { id, content, type, config } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO qr_codes (id, content, type, config) VALUES (?, ?, ?, ?)");
      stmt.run(id, content, type, JSON.stringify(config));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save QR code" });
    }
  });

  // API: Get History
  app.get("/api/history", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM qr_codes ORDER BY created_at DESC").all();
      res.json(rows.map(row => ({
        ...row,
        config: JSON.parse(row.config as string),
        favorite: !!row.favorite
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // API: Delete from history
  app.delete("/api/qr/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM qr_codes WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // API: Toggle favorite
  app.put("/api/qr/:id/favorite", (req, res) => {
    try {
      const { favorite } = req.body;
      db.prepare("UPDATE qr_codes SET favorite = ? WHERE id = ?").run(favorite ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update favorite" });
    }
  });

  // API: Update note
  app.put("/api/qr/:id/note", (req, res) => {
    try {
      const { note } = req.body;
      db.prepare("UPDATE qr_codes SET note = ? WHERE id = ?").run(note || null, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  // Dynamic QR Redirect & Scan Tracking with Landing Page
  app.get("/s/:id", (req, res) => {
    const id = req.params.id;
    const row = db.prepare("SELECT * FROM qr_codes WHERE id = ?").get(id) as { content: string; type: string; config: string; created_at: string } | undefined;

    if (row) {
      db.prepare("UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?").run(id);
      const config = JSON.parse(row.config as string);
      
      // Generate QR code URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(row.content)}&color=${config.fgColor.replace("#", "")}&bgcolor=${config.bgColor.replace("#", "")}`;
      
      // Return beautiful landing page
      res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code - ${row.type}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 32px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
      text-align: center;
      animation: slideUp 0.6s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .qr-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 24px;
    }
    .qr-wrapper::before {
      content: '';
      position: absolute;
      inset: -12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 24px;
      z-index: -1;
      opacity: 0.2;
    }
    .qr-code {
      width: 280px;
      height: 280px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      background: white;
      padding: 16px;
    }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 12px;
    }
    .content {
      background: #f5f5f7;
      border-radius: 16px;
      padding: 16px;
      margin: 20px 0;
      word-break: break-all;
    }
    .content p {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
    .btn {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${row.type}</span>
    <div class="qr-wrapper">
      <img src="${qrUrl}" alt="QR Code" class="qr-code" />
    </div>
    <h1>QR Code</h1>
    <div class="content">
      <p>${row.content}</p>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${row.scan_count + 1}</div>
        <div class="stat-label">сканирований</div>
      </div>
      <div class="stat">
        <div class="stat-value">${new Date(row.created_at).toLocaleDateString("ru-RU")}</div>
        <div class="stat-label">создан</div>
      </div>
    </div>
    ${row.content.startsWith("http") ? `<a href="${row.content}" class="btn" target="_blank">Перейти по ссылке</a>` : ''}
    <div class="footer">
      Создано с QR Craft
    </div>
  </div>
</body>
</html>
      `);
    } else {
      res.status(404).send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code не найден</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .error {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      padding: 48px;
      border-radius: 32px;
      max-width: 400px;
    }
    h1 { font-size: 72px; margin-bottom: 16px; }
    p { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="error">
    <h1>404</h1>
    <p>QR Code не найден или был удалён</p>
  </div>
</body>
</html>
      `);
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
