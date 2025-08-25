const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getQuery } = require('../database/init');
const { generateTokens, generateAdminToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Device registration
router.post('/register', async (req, res) => {
  try {
    const { deviceId, appVersion, platform, securityConfig } = req.body;

    // Validate required fields
    if (!deviceId || !appVersion || !platform) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'deviceId, appVersion, and platform are required'
      });
    }

    // Check if device already exists
    const existingDevice = await getQuery(
      'SELECT device_id FROM devices WHERE device_id = ?',
      [deviceId]
    );

    let result;
    if (existingDevice) {
      // Update existing device
      result = await runQuery(
        `UPDATE devices SET 
         app_version = ?, platform = ?, security_config = ?, 
         is_online = 1, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = ?`,
        [appVersion, platform, JSON.stringify(securityConfig || {}), deviceId]
      );
      logger.info(`Device updated: ${deviceId}`);
    } else {
      // Register new device
      result = await runQuery(
        `INSERT INTO devices (device_id, app_version, platform, security_config, is_online)
         VALUES (?, ?, ?, ?, 1)`,
        [deviceId, appVersion, platform, JSON.stringify(securityConfig || {})]
      );
      logger.info(`New device registered: ${deviceId}`);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(deviceId);

    // Store tokens in database
    const accessTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean up old tokens for this device
    await runQuery('DELETE FROM device_tokens WHERE device_id = ?', [deviceId]);

    // Store new tokens
    await runQuery(
      'INSERT INTO device_tokens (device_id, token_hash, expires_at, is_refresh_token) VALUES (?, ?, ?, ?)',
      [deviceId, accessToken, accessTokenExpiry.toISOString(), 0]
    );

    await runQuery(
      'INSERT INTO device_tokens (device_id, token_hash, expires_at, is_refresh_token) VALUES (?, ?, ?, ?)',
      [deviceId, refreshToken, refreshTokenExpiry.toISOString(), 1]
    );

    res.status(201).json({
      message: existingDevice ? 'Device updated successfully' : 'Device registered successfully',
      deviceId,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      },
      device: {
        deviceId,
        appVersion,
        platform,
        securityConfig: securityConfig || {},
        isOnline: true,
        registeredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Device registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during device registration'
    });
  }
});

// Device login (for existing devices)
router.post('/login', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        error: 'Device ID required',
        message: 'Please provide a valid device ID'
      });
    }

    // Check if device exists
    const device = await getQuery(
      'SELECT * FROM devices WHERE device_id = ?',
      [deviceId]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        message: 'The specified device is not registered'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(deviceId);

    // Clean up old tokens
    await runQuery('DELETE FROM device_tokens WHERE device_id = ?', [deviceId]);

    // Store new tokens
    const accessTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await runQuery(
      'INSERT INTO device_tokens (device_id, token_hash, expires_at, is_refresh_token) VALUES (?, ?, ?, ?)',
      [deviceId, accessToken, accessTokenExpiry.toISOString(), 0]
    );

    await runQuery(
      'INSERT INTO device_tokens (device_id, token_hash, expires_at, is_refresh_token) VALUES (?, ?, ?, ?)',
      [deviceId, refreshToken, refreshTokenExpiry.toISOString(), 1]
    );

    // Update device status
    await runQuery(
      'UPDATE devices SET is_online = 1, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?',
      [deviceId]
    );

    res.json({
      message: 'Login successful',
      deviceId,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      },
      device: {
        deviceId: device.device_id,
        appVersion: device.app_version,
        platform: device.platform,
        isOnline: true,
        lastSeen: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Device login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during device login'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Please provide a valid refresh token'
      });
    }

    // Verify refresh token exists and is valid
    const tokenRecord = await getQuery(
      'SELECT device_id FROM device_tokens WHERE token_hash = ? AND is_refresh_token = 1 AND expires_at > datetime("now")',
      [refreshToken]
    );

    if (!tokenRecord) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'The provided refresh token is invalid or expired'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenRecord.device_id);

    // Update tokens in database
    await runQuery('DELETE FROM device_tokens WHERE device_id = ?', [tokenRecord.device_id]);

    const accessTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await runQuery(
      'INSERT INTO device_tokens (device_id, token_hash, expires_at, is_refresh_token) VALUES (?, ?, ?, ?)',
      [tokenRecord.device_id, accessToken, accessTokenExpiry.toISOString(), 0]
    );

    await runQuery(
      'INSERT INTO device_tokens (device_id, token_hash, expires_at, is_refresh_token) VALUES (?, ?, ?, ?)',
      [tokenRecord.device_id, newRefreshToken, refreshTokenExpiry.toISOString(), 1]
    );

    res.json({
      message: 'Token refreshed successfully',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred during token refresh'
    });
  }
});

// Device logout
router.post('/logout', async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        error: 'Device ID required',
        message: 'Please provide a valid device ID'
      });
    }

    // Remove all tokens for this device
    await runQuery('DELETE FROM device_tokens WHERE device_id = ?', [deviceId]);

    // Update device status
    await runQuery(
      'UPDATE devices SET is_online = 0 WHERE device_id = ?',
      [deviceId]
    );

    res.json({
      message: 'Logout successful',
      deviceId
    });

  } catch (error) {
    logger.error('Device logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during device logout'
    });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password required',
        message: 'Please provide both username and password'
      });
    }

    // Get admin user
    const adminUser = await getQuery(
      'SELECT id, username, password_hash, role FROM admin_users WHERE username = ?',
      [username]
    );

    if (!adminUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, adminUser.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Update last login
    await runQuery(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [adminUser.id]
    );

    // Generate admin token
    const adminToken = generateAdminToken(adminUser.id, adminUser.username);

    res.json({
      message: 'Admin login successful',
      token: adminToken,
      admin: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        lastLogin: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      error: 'Admin login failed',
      message: 'An error occurred during admin login'
    });
  }
});

module.exports = router;
