import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import the new route
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import yearRoutes from './routes/yearRoutes.js';
import courseYearMonthBatchRoutes from './routes/courseYearMonthBatchRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dineshsiva693:dineshsiva693@cluster0.uep56.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
 ;
// || 'mongodb://localhost:27017/Cybernaut_Slot-Booking';
  app.use(cors(
  {
    origin: ["https://deploy-mern-lwhq.vercel.app"],
    methods :["post","get",],
    credentials: true,
  }
 ));
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// CORS Preflight handler for all routes
app.options('*', cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Use routes
app.use('/api', courseRoutes);
app.use('/api', studentRoutes);
app.use('/api', yearRoutes);
app.use('/api', courseYearMonthBatchRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: err.message 
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

export default app;
