// server.js - Personal Assistant API with MongoDB
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

// Import routes and middleware
import routes from "./routes/index.js";
import { errorHandler, logger } from "./middleware/index.js";

// Load environment variables
dotenv.config();

// MongoDB connection configuration
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/personalAssistantDB";
    
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log(`📍 URI: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log("✅ MongoDB connected successfully");
    
    // Test the connection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Database: ${db.databaseName}`);
    console.log(`📁 Collections: ${collections.map(c => c.name).join(', ') || 'None'}`);
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("🔄 Using in-memory storage as fallback");
    
    // Set up in-memory storage as fallback
    global.inMemoryStorage = {
      logs: [],
      reminders: []
    };
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

// Initialize database connection
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://192.168.1.3:3000',
    'http://192.168.1.3:8081',
    'exp://192.168.1.3:8081',
    'exp://localhost:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger);

// Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    message: "Personal Assistant API",
    version: "1.0.0",
    database: {
      status: dbStatus,
      type: dbStatus === 'connected' ? 'MongoDB' : 'In-Memory Fallback'
    },
    endpoints: {
      chat: "POST /api/chat",
      logs: "GET /api/logs",
      reminders: "GET /api/reminders",
      health: "GET /api/health"
    },
    examples: {
      log: "Log that I woke up at 7:30 AM",
      reminder: "Remind me to call mom at 9 PM",
      query: "What did I log today?"
    },
    mongodb: {
      uri: process.env.MONGODB_URI ? 'configured' : 'not configured',
      connection: dbStatus
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// ================== SERVER START ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Personal Assistant API running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.1.3:${PORT}`);
  console.log(`💬 Chat endpoint: POST http://192.168.1.3:${PORT}/api/chat`);
  console.log(`📊 Health check: GET http://192.168.1.3:${PORT}/api/health`);
  console.log(`📖 API docs: GET http://192.168.1.3:${PORT}/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'MongoDB' : 'In-Memory'}`);
});