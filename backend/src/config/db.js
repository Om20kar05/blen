import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Windows & Node 18+: Force IPv4 first to prevent IPv6 DNS drops / TLS Alert 80 with Atlas
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

let mongoMemoryServerInstance = null;

// Catch any runtime socket/TLS errors after connection is established
mongoose.connection.on('error', (err) => {
  console.error(`[Database] MongoDB connection error: ${err.message}`);
});

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const useMemoryOnly = process.env.USE_IN_MEMORY_DB === 'true';
  const uri = process.env.MONGODB_URI || 'mongodb+srv://gawaliomgmailcom:Omkar272005@omkar.03xqnr7.mongodb.net/blen_hr?retryWrites=true&w=majority';
  
  if (!useMemoryOnly) {
    try {
      // Attempt standard connection with 5-second timeout and explicit IPv4
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        family: 4,
      });

      // Active ping check: actively verify TLS handshake and replica set readiness
      await mongoose.connection.db.admin().ping();
      console.log(`[Database] MongoDB connected and verified successfully to: ${uri}`);
      return;
    } catch (initialErr) {
      console.warn(`[Database] Standard MongoDB connection to ${uri} failed: ${initialErr.message}`);
      if (initialErr.message?.includes('SSL') || initialErr.message?.includes('tlsv1 alert') || initialErr.message?.includes('80')) {
        console.warn('[Database] SSL Alert 80 detected: Atlas rejected the connection. Check that your current IP is whitelisted under Network Access in MongoDB Atlas (or add 0.0.0.0/0).');
      }
      console.log('[Database] Falling back to high-performance Embedded MongoDB Memory Server...');
    }
  }

  // Fallback to embedded in-memory MongoDB
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create({
      binary: {
        version: '7.0.14'
      }
    });
    const memUri = mongoMemoryServerInstance.getUri();
    
    await mongoose.connect(memUri);
    console.log(`[Database] Embedded MongoDB connected successfully at: ${memUri}`);

    // If memory server is used for local development, automatically seed the test accounts
    if (process.env.NODE_ENV !== 'test') {
      try {
        const { seedDatabase } = await import('../utils/seed.js');
        await seedDatabase();
      } catch (seedErr) {
        console.warn(`[Database] Auto-seeding in-memory DB skipped/failed: ${seedErr.message}`);
      }
    }
  } catch (memErr) {
    console.error(`[Database] Failed to connect to MongoDB: ${memErr.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error(`[Database] Disconnect error: ${err.message}`);
  }
};
