/**
 * Express.js server setup with CAPTCHA verification and rate limiting
 * 
 * This demonstrates a complete server implementation for the mobile app
 * with all security features integrated.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { verifyCaptchaEndpoint, logSecurityEvent, apiRateLimitMiddleware } from './security/captcha-endpoint';

const app = express();
const PORT = process.env.PORT || 3000;

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

// CORS configuration for mobile app
app.use(cors({
  origin: [
    'http://localhost:8081', // Expo development server
    'exp://192.168.1.100:8081', // Expo LAN
    process.env.APP_URL || 'https://your-app-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security logging middleware
app.use(logSecurityEvent);

// API rate limiting
app.use('/api/', apiRateLimitMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// CAPTCHA verification endpoint
app.post('/api/verify-captcha', verifyCaptchaEndpoint);

// Incident reporting endpoint (with integrated CAPTCHA verification)
app.post('/api/incidents', verifyCaptchaEndpoint);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`�� Security API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛡️  CAPTCHA endpoint: http://localhost:${PORT}/api/verify-captcha`);
  console.log(`📝 Incidents endpoint: http://localhost:${PORT}/api/incidents`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Development mode - detailed error messages enabled`);
  }
});

export default app;
