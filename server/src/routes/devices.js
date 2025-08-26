const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// Get device status
router.get('/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Verify device access
    if (req.device.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own device status',
      });
    }

    // Get device info
    const device = await getQuery('SELECT * FROM devices WHERE device_id = ?', [
      deviceId,
    ]);

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        message: 'The specified device was not found',
      });
    }

    // Get latest config
    const latestConfig = await getQuery(
      'SELECT config, version, created_at FROM device_configs WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
      [deviceId]
    );

    // Get pending commands count
    const pendingCommands = await getQuery(
      'SELECT COUNT(*) as count FROM commands WHERE device_id = ? AND status = "pending"',
      [deviceId]
    );

    res.json({
      deviceId: device.device_id,
      isOnline: Boolean(device.is_online),
      lastSeen: device.last_seen,
      currentConfig: latestConfig ? JSON.parse(latestConfig.config) : null,
      configVersion: latestConfig ? latestConfig.version : 0,
      threatLevel: device.threat_level,
      platform: device.platform,
      appVersion: device.app_version,
      securityConfig: JSON.parse(device.security_config || '{}'),
      pendingCommands: pendingCommands.count,
      status: {
        registeredAt: device.created_at,
        lastUpdated: device.updated_at,
      },
    });
  } catch (error) {
    logger.error('Get device status error:', error);
    res.status(500).json({
      error: 'Failed to get device status',
      message: 'An error occurred while retrieving device status',
    });
  }
});

// Update device configuration
router.put('/:deviceId/config', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { config } = req.body;

    // Verify device access
    if (req.device.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own device configuration',
      });
    }

    if (!config) {
      return res.status(400).json({
        error: 'Configuration required',
        message: 'Please provide a valid configuration object',
      });
    }

    // Get current config version
    const currentConfig = await getQuery(
      'SELECT version FROM device_configs WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
      [deviceId]
    );

    const newVersion = currentConfig ? currentConfig.version + 1 : 1;

    // Save new configuration
    await runQuery(
      'INSERT INTO device_configs (device_id, config, version) VALUES (?, ?, ?)',
      [deviceId, JSON.stringify(config), newVersion]
    );

    // Update device last updated timestamp
    await runQuery(
      'UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE device_id = ?',
      [deviceId]
    );

    logger.info(
      `Configuration updated for device ${deviceId}, version ${newVersion}`
    );

    res.json({
      message: 'Configuration updated successfully',
      deviceId,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Update device config error:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      message: 'An error occurred while updating device configuration',
    });
  }
});

// Sync device state with server
router.post('/:deviceId/sync', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const syncData = req.body;

    // Verify device access
    if (req.device.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only sync your own device',
      });
    }

    // Validate sync data
    if (!syncData.timestamp) {
      syncData.timestamp = new Date().toISOString();
    }

    // Store sync log
    await runQuery(
      'INSERT INTO sync_logs (device_id, sync_data, sync_type) VALUES (?, ?, ?)',
      [deviceId, JSON.stringify(syncData), 'regular']
    );

    // Update device last seen and online status
    await runQuery(
      'UPDATE devices SET last_seen = CURRENT_TIMESTAMP, is_online = 1, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?',
      [deviceId]
    );

    // If config is provided, save it as new version
    if (syncData.config) {
      const currentConfig = await getQuery(
        'SELECT version FROM device_configs WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
        [deviceId]
      );

      const newVersion = currentConfig ? currentConfig.version + 1 : 1;

      await runQuery(
        'INSERT INTO device_configs (device_id, config, version) VALUES (?, ?, ?)',
        [deviceId, JSON.stringify(syncData.config), newVersion]
      );
    }

    // Get any pending configuration updates or commands
    const pendingCommands = await allQuery(
      'SELECT command_id, command, parameters, priority, created_at FROM commands WHERE device_id = ? AND status = "pending" ORDER BY created_at ASC',
      [deviceId]
    );

    const latestServerConfig = await getQuery(
      'SELECT config, version FROM device_configs WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
      [deviceId]
    );

    logger.info(`Device ${deviceId} sync completed`);

    res.json({
      message: 'Sync completed successfully',
      deviceId,
      syncTime: new Date().toISOString(),
      pendingCommands: pendingCommands.map((cmd) => ({
        id: cmd.command_id,
        command: cmd.command,
        parameters: cmd.parameters ? JSON.parse(cmd.parameters) : null,
        priority: cmd.priority,
        timestamp: cmd.created_at,
      })),
      serverConfig: latestServerConfig
        ? {
            config: JSON.parse(latestServerConfig.config),
            version: latestServerConfig.version,
          }
        : null,
      nextSyncIn: parseInt(process.env.SYNC_INTERVAL_MS) || 900000, // 15 minutes
    });
  } catch (error) {
    logger.error('Device sync error:', error);
    res.status(500).json({
      error: 'Sync failed',
      message: 'An error occurred during device sync',
    });
  }
});

// Receive device status reports
router.post('/:deviceId/status-report', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const statusData = req.body;

    // Verify device access
    if (req.device.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only report status for your own device',
      });
    }

    // Validate status data
    if (!statusData.timestamp) {
      statusData.timestamp = new Date().toISOString();
    }

    // Store status report
    await runQuery(
      'INSERT INTO status_reports (device_id, status_data, report_type) VALUES (?, ?, ?)',
      [deviceId, JSON.stringify(statusData), statusData.reportType || 'regular']
    );

    // Update device status based on report
    let threatLevel = 'low';
    if (statusData.isLockedOut || statusData.accessAttempts > 5) {
      threatLevel = 'high';
    } else if (statusData.accessAttempts > 2) {
      threatLevel = 'medium';
    }

    await runQuery(
      'UPDATE devices SET last_seen = CURRENT_TIMESTAMP, is_online = 1, threat_level = ?, updated_at = CURRENT_TIMESTAMP WHERE device_id = ?',
      [threatLevel, deviceId]
    );

    logger.info(
      `Status report received from device ${deviceId}, threat level: ${threatLevel}`
    );

    res.json({
      message: 'Status report received successfully',
      deviceId,
      reportTime: new Date().toISOString(),
      threatLevel,
      recommendations:
        threatLevel === 'high'
          ? [
              'Review security settings',
              'Check for unauthorized access attempts',
              'Consider temporary lockdown if necessary',
            ]
          : [],
    });
  } catch (error) {
    logger.error('Status report error:', error);
    res.status(500).json({
      error: 'Failed to process status report',
      message: 'An error occurred while processing the status report',
    });
  }
});

// Remote wipe device
router.post('/:deviceId/wipe', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { confirmationCode, reason } = req.body;

    // Verify device access (or admin access)
    if (req.device.deviceId !== deviceId && !req.admin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only wipe your own device or use admin privileges',
      });
    }

    // Verify confirmation code (simple check - in production, use more secure method)
    const expectedCode = `WIPE_CONFIRM_${deviceId.slice(-5).toUpperCase()}`;
    if (confirmationCode !== expectedCode) {
      return res.status(400).json({
        error: 'Invalid confirmation code',
        message: `Please provide the correct confirmation code: ${expectedCode}`,
      });
    }

    // Create wipe command
    const commandId = `cmd_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    await runQuery(
      'INSERT INTO commands (command_id, device_id, command, parameters, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        commandId,
        deviceId,
        'wipe',
        JSON.stringify({
          reason: reason || 'manual_wipe',
          timestamp: new Date().toISOString(),
        }),
        'high',
        'pending',
      ]
    );

    // Log the wipe request
    await runQuery(
      'INSERT INTO status_reports (device_id, status_data, report_type) VALUES (?, ?, ?)',
      [
        deviceId,
        JSON.stringify({
          action: 'wipe_requested',
          reason,
          requestedBy: req.admin ? req.admin.username : 'device_owner',
          timestamp: new Date().toISOString(),
        }),
        'security_event',
      ]
    );

    logger.warn(
      `Remote wipe requested for device ${deviceId}, reason: ${reason}`
    );

    res.json({
      message: 'Remote wipe command issued successfully',
      deviceId,
      commandId,
      confirmationCode,
      issuedAt: new Date().toISOString(),
      warning:
        'This action cannot be undone. The device will be wiped on next sync.',
    });
  } catch (error) {
    logger.error('Remote wipe error:', error);
    res.status(500).json({
      error: 'Failed to issue remote wipe',
      message: 'An error occurred while issuing the remote wipe command',
    });
  }
});

// List all devices (admin only)
router.get('/', async (req, res) => {
  try {
    // This endpoint requires admin privileges - should be called through admin routes
    if (!req.admin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This endpoint requires admin privileges',
      });
    }

    const { page = 1, limit = 20, status, platform } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [];
    let queryParams = [];

    if (status === 'online') {
      whereConditions.push('is_online = 1');
    } else if (status === 'offline') {
      whereConditions.push('is_online = 0');
    }

    if (platform) {
      whereConditions.push('platform = ?');
      queryParams.push(platform);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // Get total count
    const totalResult = await getQuery(
      `SELECT COUNT(*) as total FROM devices ${whereClause}`,
      queryParams
    );

    // Get devices with pagination
    const devices = await allQuery(
      `SELECT 
        device_id, app_version, platform, security_config, 
        is_online, last_seen, threat_level, created_at, updated_at
       FROM devices 
       ${whereClause}
       ORDER BY last_seen DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get pending commands count for each device
    const devicesWithStats = await Promise.all(
      devices.map(async (device) => {
        const commandsCount = await getQuery(
          'SELECT COUNT(*) as count FROM commands WHERE device_id = ? AND status = "pending"',
          [device.device_id]
        );

        return {
          ...device,
          securityConfig: JSON.parse(device.security_config || '{}'),
          isOnline: Boolean(device.is_online),
          pendingCommands: commandsCount.count,
        };
      })
    );

    res.json({
      devices: devicesWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResult.total / limit),
        totalDevices: totalResult.total,
        devicesPerPage: parseInt(limit),
      },
      filters: {
        status: status || 'all',
        platform: platform || 'all',
      },
    });
  } catch (error) {
    logger.error('List devices error:', error);
    res.status(500).json({
      error: 'Failed to list devices',
      message: 'An error occurred while retrieving devices list',
    });
  }
});

module.exports = router;
