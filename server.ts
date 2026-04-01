import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';

dotenv.config();

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = fs.existsSync(path.join(__dirname, 'firebase-applet-config.json'))
  ? path.join(__dirname, 'firebase-applet-config.json')
  : path.join(process.cwd(), 'firebase-applet-config.json');

if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
} else {
  console.error("Firebase config not found, admin SDK not initialized.");
}

async function startServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, the server is bundled and placed in the dist directory
    // along with the static files.
    const distPath = fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.join(process.cwd(), 'dist');
    
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
