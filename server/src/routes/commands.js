const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getQuery, allQuery } = require('../database/init');
const logger = require('../utils/logger');

const router = express.Router();

// Get pending commands for a device
router.get('/:deviceId/commands', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Verify device access
    if (req.device.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access commands for your own device',
      });
    }

    // Get pending commands
    const commands = await allQuery(
      `SELECT command_id, command, parameters, priority, created_at 
       FROM commands 
       WHERE device_id = ? AND status = 'pending' 
       ORDER BY priority DESC, created_at ASC`,
      [deviceId]
    );

    // Format commands for response
    const formattedCommands = commands.map((cmd) => ({
      id: cmd.command_id,
      command: cmd.command,
      parameters: cmd.parameters ? JSON.parse(cmd.parameters) : {},
      priority: cmd.priority,
      timestamp: cmd.created_at,
    }));

    logger.info(
      `Retrieved ${commands.length} pending commands for device ${deviceId}`
    );

    res.json({
      commands: formattedCommands,
      deviceId,
      retrievedAt: new Date().toISOString(),
      totalPending: commands.length,
    });
  } catch (error) {
    logger.error('Get commands error:', error);
    res.status(500).json({
      error: 'Failed to retrieve commands',
      message: 'An error occurred while retrieving pending commands',
    });
  }
});

// Create a new command for a device (admin only)
router.post('/:deviceId/commands', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, parameters, priority = 'normal' } = req.body;

    // This endpoint typically requires admin access
    if (!req.admin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Creating commands requires admin privileges',
      });
    }

    // Validate command
    const validCommands = [
      'activate',
      'deactivate',
      'wipe',
      'update_config',
      'report_status',
    ];
    if (!validCommands.includes(command)) {
      return res.status(400).json({
        error: 'Invalid command',
        message: `Command must be one of: ${validCommands.join(', ')}`,
      });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority',
        message: `Priority must be one of: ${validPriorities.join(', ')}`,
      });
    }

    // Verify device exists
    const device = await getQuery(
      'SELECT device_id FROM devices WHERE device_id = ?',
      [deviceId]
    );

    if (!device) {
      return res.status(404).json({
        error: 'Device not found',
        message: 'The specified device was not found',
      });
    }

    // Generate command ID
    const commandId = `cmd_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Create command
    await runQuery(
      'INSERT INTO commands (command_id, device_id, command, parameters, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        commandId,
        deviceId,
        command,
        parameters ? JSON.stringify(parameters) : null,
        priority,
        'pending',
      ]
    );

    logger.info(
      `Command ${command} created for device ${deviceId} by admin ${req.admin.username}`
    );

    res.status(201).json({
      message: 'Command created successfully',
      commandId,
      deviceId,
      command,
      parameters: parameters || {},
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: req.admin.username,
    });
  } catch (error) {
    logger.error('Create command error:', error);
    res.status(500).json({
      error: 'Failed to create command',
      message: 'An error occurred while creating the command',
    });
  }
});

// Acknowledge command execution
router.post('/:deviceId/commands/:commandId/acknowledge', async (req, res) => {
  try {
    const { deviceId, commandId } = req.params;
    const { executed, result, executionTime } = req.body;

    // Verify device access
    if (req.device.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only acknowledge commands for your own device',
      });
    }

    // Verify command exists and belongs to this device
    const command = await getQuery(
      'SELECT command_id, command, status FROM commands WHERE command_id = ? AND device_id = ?',
      [commandId, deviceId]
    );

    if (!command) {
      return res.status(404).json({
        error: 'Command not found',
        message: 'The specified command was not found for this device',
      });
    }

    if (command.status !== 'pending') {
      return res.status(400).json({
        error: 'Command already processed',
        message: `Command status is already '${command.status}'`,
      });
    }

    // Update command status
    const newStatus = executed ? 'completed' : 'failed';
    const execTime = executionTime || new Date().toISOString();

    await runQuery(
      'UPDATE commands SET status = ?, executed_at = ?, execution_result = ? WHERE command_id = ?',
      [newStatus, execTime, result ? JSON.stringify(result) : null, commandId]
    );

    // Log the acknowledgment
    await runQuery(
      'INSERT INTO status_reports (device_id, status_data, report_type) VALUES (?, ?, ?)',
      [
        deviceId,
        JSON.stringify({
          action: 'command_acknowledged',
          commandId,
          command: command.command,
          executed,
          result,
          executionTime: execTime,
        }),
        'command_execution',
      ]
    );

    logger.info(
      `Command ${commandId} acknowledged by device ${deviceId}, status: ${newStatus}`
    );

    res.json({
      message: 'Command acknowledgment received',
      commandId,
      deviceId,
      command: command.command,
      status: newStatus,
      executed,
      executionTime: execTime,
      result: result || null,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Command acknowledgment error:', error);
    res.status(500).json({
      error: 'Failed to process acknowledgment',
      message: 'An error occurred while processing the command acknowledgment',
    });
  }
});

// Get command history for a device
router.get('/:deviceId/commands/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { page = 1, limit = 50, status, command } = req.query;

    // Verify device access or admin access
    if (req.device.deviceId !== deviceId && !req.admin) {
      return res.status(403).json({
        error: 'Access denied',
        message:
          'You can only access command history for your own device or use admin privileges',
      });
    }

    const offset = (page - 1) * limit;

    // Build query conditions
    const whereConditions = ['device_id = ?'];
    const queryParams = [deviceId];

    if (status) {
      whereConditions.push('status = ?');
      queryParams.push(status);
    }

    if (command) {
      whereConditions.push('command = ?');
      queryParams.push(command);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const totalResult = await getQuery(
      `SELECT COUNT(*) as total FROM commands ${whereClause}`,
      queryParams
    );

    // Get command history with pagination
    const commands = await allQuery(
      `SELECT command_id, command, parameters, priority, status, created_at, executed_at, execution_result
       FROM commands 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Format commands for response
    const formattedCommands = commands.map((cmd) => ({
      id: cmd.command_id,
      command: cmd.command,
      parameters: cmd.parameters ? JSON.parse(cmd.parameters) : {},
      priority: cmd.priority,
      status: cmd.status,
      createdAt: cmd.created_at,
      executedAt: cmd.executed_at,
      executionResult: cmd.execution_result
        ? JSON.parse(cmd.execution_result)
        : null,
    }));

    res.json({
      commands: formattedCommands,
      deviceId,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResult.total / limit),
        totalCommands: totalResult.total,
        commandsPerPage: parseInt(limit),
      },
      filters: {
        status: status || 'all',
        command: command || 'all',
      },
    });
  } catch (error) {
    logger.error('Get command history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve command history',
      message: 'An error occurred while retrieving command history',
    });
  }
});

// Bulk command creation (admin only)
router.post('/bulk', async (req, res) => {
  try {
    const { deviceIds, command, parameters, priority = 'normal' } = req.body;

    // This endpoint requires admin access
    if (!req.admin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Bulk command creation requires admin privileges',
      });
    }

    // Validate input
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({
        error: 'Device IDs required',
        message: 'Please provide an array of device IDs',
      });
    }

    const validCommands = [
      'activate',
      'deactivate',
      'wipe',
      'update_config',
      'report_status',
    ];
    if (!validCommands.includes(command)) {
      return res.status(400).json({
        error: 'Invalid command',
        message: `Command must be one of: ${validCommands.join(', ')}`,
      });
    }

    // Verify all devices exist
    const existingDevices = await allQuery(
      `SELECT device_id FROM devices WHERE device_id IN (${deviceIds
        .map(() => '?')
        .join(',')})`,
      deviceIds
    );

    const existingDeviceIds = existingDevices.map((d) => d.device_id);
    const missingDevices = deviceIds.filter(
      (id) => !existingDeviceIds.includes(id)
    );

    if (missingDevices.length > 0) {
      return res.status(400).json({
        error: 'Some devices not found',
        message: `The following devices were not found: ${missingDevices.join(
          ', '
        )}`,
      });
    }

    // Create commands for all devices
    const commandResults = [];
    const timestamp = new Date().toISOString();

    for (const deviceId of deviceIds) {
      const commandId = `cmd_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      await runQuery(
        'INSERT INTO commands (command_id, device_id, command, parameters, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          commandId,
          deviceId,
          command,
          parameters ? JSON.stringify(parameters) : null,
          priority,
          'pending',
        ]
      );

      commandResults.push({
        commandId,
        deviceId,
        status: 'created',
      });
    }

    logger.info(
      `Bulk command ${command} created for ${deviceIds.length} devices by admin ${req.admin.username}`
    );

    res.status(201).json({
      message: 'Bulk commands created successfully',
      command,
      parameters: parameters || {},
      priority,
      deviceCount: deviceIds.length,
      commands: commandResults,
      createdAt: timestamp,
      createdBy: req.admin.username,
    });
  } catch (error) {
    logger.error('Bulk command creation error:', error);
    res.status(500).json({
      error: 'Failed to create bulk commands',
      message: 'An error occurred while creating bulk commands',
    });
  }
});

module.exports = router;
