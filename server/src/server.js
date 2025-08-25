const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const commandRoutes = require('./routes/commands');
const adminRoutes = require('./routes/admin');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { setupWebSocket } = require('./websocket/socketHandler');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:19006"],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:19006"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'X-App-Version']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'DESIST Management Server API',
    version: '1.0.0',
    description: 'Remote management API for DESIST mobile app',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new device',
        'POST /api/auth/login': 'Device login',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/logout': 'Device logout'
      },
      devices: {
        'GET /api/devices': 'List all devices (admin)',
        'GET /api/devices/:deviceId/status': 'Get device status',
        'PUT /api/devices/:deviceId/config': 'Update device configuration',
        'POST /api/devices/:deviceId/sync': 'Sync device state',
        'POST /api/devices/:deviceId/status-report': 'Receive status report',
        'POST /api/devices/:deviceId/wipe': 'Remote wipe device'
      },
      commands: {
        'GET /api/devices/:deviceId/commands': 'Get pending commands',
        'POST /api/devices/:deviceId/commands': 'Create new command',
        'POST /api/devices/:deviceId/commands/:commandId/acknowledge': 'Acknowledge command execution'
      },
      admin: {
        'GET /api/admin/dashboard': 'Admin dashboard data',
        'GET /api/admin/devices': 'Device management interface',
        'POST /api/admin/commands/broadcast': 'Broadcast command to multiple devices'
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', authenticateToken, deviceRoutes);
app.use('/api/devices', authenticateToken, commandRoutes);
app.use('/api/admin', adminRoutes);

// WebSocket setup
setupWebSocket(io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
    availableEndpoints: '/api'
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Start server
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 DESIST Management Server running on http://${HOST}:${PORT}`);
      logger.info(`📋 API Documentation available at http://${HOST}:${PORT}/api`);
      logger.info(`💓 Health check available at http://${HOST}:${PORT}/health`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.WEBSOCKET_ENABLED === 'true') {
        logger.info(`🔌 WebSocket server running on ws://${HOST}:${PORT}`);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
