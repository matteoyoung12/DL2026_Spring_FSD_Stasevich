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
    scan_count INTEGER DEFAULT 0
  );
`);

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
        config: JSON.parse(row.config as string)
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

  // Dynamic QR Redirect & Scan Tracking
  app.get("/s/:id", (req, res) => {
    const id = req.params.id;
    const row = db.prepare("SELECT content FROM qr_codes WHERE id = ?").get(id) as { content: string } | undefined;
    
    if (row) {
      db.prepare("UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?").run(id);
      // If it's a URL, redirect. Otherwise, we might show a landing page, 
      // but for simplicity, we'll redirect if it looks like a URL.
      if (row.content.startsWith("http")) {
        return res.redirect(row.content);
      }
      res.send(`Content: ${row.content}`);
    } else {
      res.status(404).send("QR Code not found");
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
