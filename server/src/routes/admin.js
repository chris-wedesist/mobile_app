const express = require('express');
const { authenticateAdmin } = require('../middleware/auth');
const { runQuery, getQuery, allQuery } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Get overall statistics
    const totalDevices = await getQuery('SELECT COUNT(*) as count FROM devices');
    const onlineDevices = await getQuery('SELECT COUNT(*) as count FROM devices WHERE is_online = 1');
    const pendingCommands = await getQuery('SELECT COUNT(*) as count FROM commands WHERE status = "pending"');
    const recentSyncs = await getQuery(
      'SELECT COUNT(*) as count FROM sync_logs WHERE created_at > datetime("now", "-1 hour")'
    );

    // Get threat level distribution
    const threatLevels = await allQuery(
      'SELECT threat_level, COUNT(*) as count FROM devices GROUP BY threat_level'
    );

    // Get platform distribution
    const platforms = await allQuery(
      'SELECT platform, COUNT(*) as count FROM devices GROUP BY platform'
    );

    // Get recent activity (last 24 hours)
    const recentActivity = await allQuery(`
      SELECT 'sync' as type, device_id, created_at, 'Device sync' as description
      FROM sync_logs 
      WHERE created_at > datetime('now', '-24 hours')
      UNION ALL
      SELECT 'command' as type, device_id, created_at, 'Command: ' || command as description
      FROM commands 
      WHERE created_at > datetime('now', '-24 hours')
      UNION ALL
      SELECT 'status_report' as type, device_id, created_at, 'Status report' as description
      FROM status_reports 
      WHERE created_at > datetime('now', '-24 hours')
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    // Get devices with high threat levels
    const highThreatDevices = await allQuery(
      'SELECT device_id, platform, last_seen, threat_level FROM devices WHERE threat_level = "high" ORDER BY last_seen DESC LIMIT 10'
    );

    // Get command execution statistics
    const commandStats = await allQuery(
      'SELECT command, status, COUNT(*) as count FROM commands GROUP BY command, status'
    );

    res.json({
      overview: {
        totalDevices: totalDevices.count,
        onlineDevices: onlineDevices.count,
        offlineDevices: totalDevices.count - onlineDevices.count,
        pendingCommands: pendingCommands.count,
        recentSyncs: recentSyncs.count
      },
      threatLevels: threatLevels.reduce((acc, tl) => {
        acc[tl.threat_level] = tl.count;
        return acc;
      }, {}),
      platforms: platforms.reduce((acc, p) => {
        acc[p.platform] = p.count;
        return acc;
      }, {}),
      recentActivity,
      highThreatDevices,
      commandStats: commandStats.reduce((acc, cs) => {
        if (!acc[cs.command]) acc[cs.command] = {};
        acc[cs.command][cs.status] = cs.count;
        return acc;
      }, {}),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard data',
      message: 'An error occurred while loading dashboard data'
    });
  }
});

// Device management interface
router.get('/devices', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, platform, threatLevel, search } = req.query;
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

    if (threatLevel) {
      whereConditions.push('threat_level = ?');
      queryParams.push(threatLevel);
    }

    if (search) {
      whereConditions.push('device_id LIKE ?');
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const totalResult = await getQuery(
      `SELECT COUNT(*) as total FROM devices ${whereClause}`,
      queryParams
    );

    // Get devices with additional information
    const devices = await allQuery(`
      SELECT 
        d.device_id, d.app_version, d.platform, d.security_config, 
        d.is_online, d.last_seen, d.threat_level, d.created_at, d.updated_at,
        (SELECT COUNT(*) FROM commands WHERE device_id = d.device_id AND status = 'pending') as pending_commands,
        (SELECT COUNT(*) FROM sync_logs WHERE device_id = d.device_id AND created_at > datetime('now', '-24 hours')) as recent_syncs,
        (SELECT created_at FROM status_reports WHERE device_id = d.device_id ORDER BY created_at DESC LIMIT 1) as last_status_report
      FROM devices d
      ${whereClause}
      ORDER BY d.last_seen DESC 
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Format devices for response
    const formattedDevices = devices.map(device => ({
      deviceId: device.device_id,
      appVersion: device.app_version,
      platform: device.platform,
      securityConfig: JSON.parse(device.security_config || '{}'),
      isOnline: Boolean(device.is_online),
      lastSeen: device.last_seen,
      threatLevel: device.threat_level,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      pendingCommands: device.pending_commands,
      recentSyncs: device.recent_syncs,
      lastStatusReport: device.last_status_report,
      healthScore: calculateDeviceHealthScore(device)
    }));

    res.json({
      devices: formattedDevices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResult.total / limit),
        totalDevices: totalResult.total,
        devicesPerPage: parseInt(limit)
      },
      filters: {
        status: status || 'all',
        platform: platform || 'all',
        threatLevel: threatLevel || 'all',
        search: search || ''
      }
    });

  } catch (error) {
    logger.error('Admin devices list error:', error);
    res.status(500).json({
      error: 'Failed to load devices',
      message: 'An error occurred while loading devices list'
    });
  }
});

// Get detailed device information
router.get('/devices/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Get device information
    const device = await getQuery(
      'SELECT * FROM devices WHERE device_id = ?',
      [deviceId]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        message: 'The specified device was not found'
      });
    }

    // Get latest configuration
    const latestConfig = await getQuery(
      'SELECT config, version, created_at FROM device_configs WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
      [deviceId]
    );

    // Get recent commands
    const recentCommands = await allQuery(
      'SELECT command_id, command, parameters, priority, status, created_at, executed_at FROM commands WHERE device_id = ? ORDER BY created_at DESC LIMIT 10',
      [deviceId]
    );

    // Get recent sync logs
    const recentSyncs = await allQuery(
      'SELECT sync_data, sync_type, created_at FROM sync_logs WHERE device_id = ? ORDER BY created_at DESC LIMIT 10',
      [deviceId]
    );

    // Get recent status reports
    const recentStatusReports = await allQuery(
      'SELECT status_data, report_type, created_at FROM status_reports WHERE device_id = ? ORDER BY created_at DESC LIMIT 10',
      [deviceId]
    );

    res.json({
      device: {
        deviceId: device.device_id,
        appVersion: device.app_version,
        platform: device.platform,
        securityConfig: JSON.parse(device.security_config || '{}'),
        isOnline: Boolean(device.is_online),
        lastSeen: device.last_seen,
        threatLevel: device.threat_level,
        createdAt: device.created_at,
        updatedAt: device.updated_at
      },
      configuration: latestConfig ? {
        config: JSON.parse(latestConfig.config),
        version: latestConfig.version,
        updatedAt: latestConfig.created_at
      } : null,
      recentCommands: recentCommands.map(cmd => ({
        id: cmd.command_id,
        command: cmd.command,
        parameters: cmd.parameters ? JSON.parse(cmd.parameters) : {},
        priority: cmd.priority,
        status: cmd.status,
        createdAt: cmd.created_at,
        executedAt: cmd.executed_at
      })),
      recentSyncs: recentSyncs.map(sync => ({
        data: JSON.parse(sync.sync_data),
        type: sync.sync_type,
        timestamp: sync.created_at
      })),
      recentStatusReports: recentStatusReports.map(report => ({
        data: JSON.parse(report.status_data),
        type: report.report_type,
        timestamp: report.created_at
      })),
      healthScore: calculateDeviceHealthScore(device)
    });

  } catch (error) {
    logger.error('Admin device details error:', error);
    res.status(500).json({
      error: 'Failed to load device details',
      message: 'An error occurred while loading device details'
    });
  }
});

// Broadcast command to multiple devices
router.post('/commands/broadcast', async (req, res) => {
  try {
    const { deviceIds, command, parameters, priority = 'normal', filters } = req.body;

    // Validate command
    const validCommands = ['activate', 'deactivate', 'wipe', 'update_config', 'report_status'];
    if (!validCommands.includes(command)) {
      return res.status(400).json({
        error: 'Invalid command',
        message: `Command must be one of: ${validCommands.join(', ')}`
      });
    }

    let targetDeviceIds = [];

    if (deviceIds && Array.isArray(deviceIds)) {
      // Use specific device IDs
      targetDeviceIds = deviceIds;
    } else if (filters) {
      // Use filters to select devices
      let whereConditions = [];
      let queryParams = [];

      if (filters.platform) {
        whereConditions.push('platform = ?');
        queryParams.push(filters.platform);
      }

      if (filters.threatLevel) {
        whereConditions.push('threat_level = ?');
        queryParams.push(filters.threatLevel);
      }

      if (filters.isOnline !== undefined) {
        whereConditions.push('is_online = ?');
        queryParams.push(filters.isOnline ? 1 : 0);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const selectedDevices = await allQuery(
        `SELECT device_id FROM devices ${whereClause}`,
        queryParams
      );

      targetDeviceIds = selectedDevices.map(d => d.device_id);
    } else {
      return res.status(400).json({
        error: 'Device selection required',
        message: 'Please provide either deviceIds array or filters object'
      });
    }

    if (targetDeviceIds.length === 0) {
      return res.status(400).json({
        error: 'No devices selected',
        message: 'No devices match the specified criteria'
      });
    }

    // Create commands for all selected devices
    const commandResults = [];
    const timestamp = new Date().toISOString();

    for (const deviceId of targetDeviceIds) {
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await runQuery(
        'INSERT INTO commands (command_id, device_id, command, parameters, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          commandId,
          deviceId,
          command,
          parameters ? JSON.stringify(parameters) : null,
          priority,
          'pending'
        ]
      );

      commandResults.push({
        commandId,
        deviceId,
        status: 'created'
      });
    }

    logger.info(`Broadcast command ${command} sent to ${targetDeviceIds.length} devices by admin ${req.admin.username}`);

    res.status(201).json({
      message: 'Broadcast command sent successfully',
      command,
      parameters: parameters || {},
      priority,
      deviceCount: targetDeviceIds.length,
      commands: commandResults,
      createdAt: timestamp,
      createdBy: req.admin.username,
      filters: filters || null
    });

  } catch (error) {
    logger.error('Broadcast command error:', error);
    res.status(500).json({
      error: 'Failed to broadcast command',
      message: 'An error occurred while broadcasting the command'
    });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    let timeFilter = '';
    switch (period) {
      case '1h':
        timeFilter = "datetime('now', '-1 hour')";
        break;
      case '24h':
        timeFilter = "datetime('now', '-24 hours')";
        break;
      case '7d':
        timeFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        timeFilter = "datetime('now', '-30 days')";
        break;
      default:
        timeFilter = "datetime('now', '-24 hours')";
    }

    // Get various statistics
    const stats = await Promise.all([
      // Sync activity
      getQuery(`SELECT COUNT(*) as count FROM sync_logs WHERE created_at > ${timeFilter}`),
      
      // Command activity
      getQuery(`SELECT COUNT(*) as count FROM commands WHERE created_at > ${timeFilter}`),
      
      // Status reports
      getQuery(`SELECT COUNT(*) as count FROM status_reports WHERE created_at > ${timeFilter}`),
      
      // Command completion rate
      getQuery(`
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(*) as total
        FROM commands 
        WHERE created_at > ${timeFilter}
      `),
      
      // Average response time (mock calculation)
      getQuery(`
        SELECT AVG(
          (julianday(executed_at) - julianday(created_at)) * 24 * 60 * 60
        ) as avg_response_time_seconds
        FROM commands 
        WHERE executed_at IS NOT NULL AND created_at > ${timeFilter}
      `)
    ]);

    const [syncStats, commandStats, statusStats, completionStats, responseTimeStats] = stats;

    res.json({
      period,
      syncActivity: syncStats.count,
      commandActivity: commandStats.count,
      statusReports: statusStats.count,
      commandCompletion: {
        completed: completionStats.completed || 0,
        failed: completionStats.failed || 0,
        pending: completionStats.pending || 0,
        total: completionStats.total || 0,
        successRate: completionStats.total > 0 ? 
          Math.round((completionStats.completed / completionStats.total) * 100) : 0
      },
      averageResponseTime: responseTimeStats.avg_response_time_seconds || 0,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({
      error: 'Failed to load statistics',
      message: 'An error occurred while loading system statistics'
    });
  }
});

// Helper function to calculate device health score
function calculateDeviceHealthScore(device) {
  let score = 100;

  // Reduce score based on threat level
  if (device.threat_level === 'high') score -= 40;
  else if (device.threat_level === 'medium') score -= 20;

  // Reduce score if device is offline
  if (!device.is_online) score -= 30;

  // Reduce score based on time since last seen
  const lastSeen = new Date(device.last_seen);
  const now = new Date();
  const hoursSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60);

  if (hoursSinceLastSeen > 24) score -= 20;
  else if (hoursSinceLastSeen > 12) score -= 10;

  // Reduce score for pending commands
  if (device.pending_commands > 5) score -= 15;
  else if (device.pending_commands > 2) score -= 5;

  return Math.max(0, Math.min(100, score));
}

module.exports = router;
