const jwt = require('jsonwebtoken');
const { getQuery, runQuery } = require('../database/init');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message:
          'Please provide a valid access token in the Authorization header',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token exists in database and hasn't expired
    const tokenRecord = await getQuery(
      `SELECT dt.*, d.device_id, d.platform, d.app_version 
       FROM device_tokens dt 
       JOIN devices d ON dt.device_id = d.device_id 
       WHERE dt.device_id = ? AND dt.expires_at > datetime('now') AND dt.is_refresh_token = 0`,
      [decoded.deviceId]
    );

    if (!tokenRecord) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'The provided token is invalid or has expired',
      });
    }

    // Update device last seen
    await runQuery(
      'UPDATE devices SET last_seen = CURRENT_TIMESTAMP, is_online = 1 WHERE device_id = ?',
      [decoded.deviceId]
    );

    // Add device info to request
    req.device = {
      deviceId: decoded.deviceId,
      platform: tokenRecord.platform,
      appVersion: tokenRecord.app_version,
    };

    next();
  } catch (error) {
    logger.error('Token authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is malformed or invalid',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The provided token has expired. Please refresh your token.',
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
}

async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Admin access token required',
        message: 'Please provide a valid admin access token',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify admin user exists
    const adminUser = await getQuery(
      'SELECT id, username, role FROM admin_users WHERE id = ?',
      [decoded.userId]
    );

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This endpoint requires admin privileges',
      });
    }

    req.admin = {
      userId: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
    };

    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return res.status(401).json({
      error: 'Invalid admin token',
      message: 'The provided admin token is invalid or expired',
    });
  }
}

function generateTokens(deviceId) {
  const accessToken = jwt.sign({ deviceId, type: 'access' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { deviceId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET || JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
}

function generateAdminToken(userId, username) {
  return jwt.sign({ userId, username, type: 'admin' }, JWT_SECRET, {
    expiresIn: '8h',
  });
}

module.exports = {
  authenticateToken,
  authenticateAdmin,
  generateTokens,
  generateAdminToken,
};
