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
const MetaApi = require('metaapi.cloud-sdk');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
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
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // MetaApi Connection Cache
  const connections = new Map<string, any>();

  const getMetaApiConnection = async (uid: string) => {
    console.log(`Attempting to get MetaApi connection for user: ${uid}`);
    
    if (connections.has(uid)) {
      return connections.get(uid);
    }

    // Fetch credentials from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    const token = userData?.metaTrader?.token;
    const accountId = userData?.metaTrader?.accountId;

    if (!token || !accountId) {
      throw new Error('MetaTrader credentials not found in your profile. Please set them in your Profile settings.');
    }
    
    try {
      const metaApi = new MetaApi(token);
      const account = await metaApi.metatraderAccountApi.getAccount(accountId);
      
      if (account.state !== 'DEPLOYED') {
        throw new Error('Account is not deployed. Please check your MetaApi dashboard.');
      }
      
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();
      
      connections.set(uid, connection);
      return connection;
    } catch (err) {
      console.error(`MetaApi connection failed for user ${uid}:`, err);
      throw err;
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/broker/test", authenticate, async (req: any, res: any) => {
    const uid = req.user.uid;
    console.log(`Testing MetaApi connection for user: ${uid}`);
    
    try {
      // Clear existing connection to force a fresh test
      connections.delete(uid);
      
      const conn = await getMetaApiConnection(uid);
      const accountInfo = await conn.getAccountInformation();
      
      // Update status in Firestore to 'connected'
      await admin.firestore().collection('users').doc(uid).update({
        'metaTrader.status': 'connected'
      });
      
      res.json({ success: true, accountInfo });
    } catch (error: any) {
      console.error(`Test connection failed for user ${uid}:`, error);
      
      // Update status in Firestore to 'error'
      await admin.firestore().collection('users').doc(uid).update({
        'metaTrader.status': 'error'
      });
      
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/broker/status", authenticate, async (req: any, res: any) => {
    try {
      const conn = await getMetaApiConnection(req.user.uid);
      const accountInfo = await conn.getAccountInformation();
      res.json({ connected: true, accountInfo });
    } catch (error: any) {
      res.status(500).json({ connected: false, error: error.message });
    }
  });

  app.post("/api/trade/execute", authenticate, async (req: any, res: any) => {
    const { symbol, side, volume, stopLoss, takeProfit } = req.body;
    
    try {
      const conn = await getMetaApiConnection(req.user.uid);
      
      // Map symbol to MT4/MT5 format if needed
      let mtSymbol = symbol;
      if (symbol === 'XAU/USD') mtSymbol = 'XAUUSD';
      if (symbol === 'BTC/USD') mtSymbol = 'BTCUSD';

      const orderSide = side === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
      
      const result = await conn.createMarketOrder(
        mtSymbol,
        orderSide,
        parseFloat(volume),
        {
          stopLoss: parseFloat(stopLoss) || undefined,
          takeProfit: parseFloat(takeProfit) || undefined
        }
      );

      res.json({ success: true, orderId: result.orderId, result });
    } catch (error: any) {
      console.error('Trade execution error:', error);
      res.status(500).json({ success: false, error: error.message });
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

startServer().catch(console.error);
