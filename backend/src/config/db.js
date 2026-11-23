import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoMemoryServerInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blen_hr';
  
  try {
    // Attempt standard connection first with a 3-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${uri}`);
  } catch (initialErr) {
    console.warn(`[Database] Standard MongoDB connection to ${uri} failed: ${initialErr.message}`);
    console.log('[Database] Falling back to high-performance Embedded MongoDB Memory Server...');
    
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
    } catch (memErr) {
      console.error(`[Database] Failed to connect to MongoDB: ${memErr.message}`);
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error(`[Database] Disconnect error: ${err.message}`);
  }
};
