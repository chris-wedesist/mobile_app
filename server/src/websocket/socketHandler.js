const logger = require('../utils/logger');

let io = null;
const connectedDevices = new Map(); // deviceId -> socket.id mapping

function setupWebSocket(socketIO) {
  io = socketIO;

  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Handle device registration
    socket.on('device:register', (data) => {
      try {
        const { deviceId, appVersion, platform } = data;
        
        if (!deviceId) {
          socket.emit('error', { message: 'Device ID is required' });
          return;
        }

        // Store device connection
        connectedDevices.set(deviceId, {
          socketId: socket.id,
          appVersion,
          platform,
          connectedAt: new Date().toISOString()
        });

        socket.deviceId = deviceId;
        socket.join(`device:${deviceId}`);

        logger.info(`Device registered via WebSocket: ${deviceId}`);
        
        socket.emit('device:registered', {
          message: 'Device registered successfully',
          deviceId,
          connectedAt: new Date().toISOString()
        });

        // Notify admins about new device connection
        io.to('admin').emit('device:connected', {
          deviceId,
          appVersion,
          platform,
          connectedAt: new Date().toISOString()
        });

      } catch (error) {
        logger.error('Device registration error:', error);
        socket.emit('error', { message: 'Registration failed' });
      }
    });

    // Handle admin authentication
    socket.on('admin:authenticate', (data) => {
      try {
        const { token } = data;
        
        // In a real implementation, verify JWT token here
        // For now, we'll use a simple check
        if (token && token.startsWith('admin_')) {
          socket.join('admin');
          socket.isAdmin = true;
          
          logger.info(`Admin authenticated via WebSocket: ${socket.id}`);
          
          socket.emit('admin:authenticated', {
            message: 'Admin authenticated successfully',
            connectedDevices: Array.from(connectedDevices.entries()).map(([deviceId, info]) => ({
              deviceId,
              ...info
            }))
          });
        } else {
          socket.emit('error', { message: 'Invalid admin token' });
        }
      } catch (error) {
        logger.error('Admin authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle real-time command execution
    socket.on('command:execute', (data) => {
      try {
        if (!socket.isAdmin) {
          socket.emit('error', { message: 'Admin privileges required' });
          return;
        }

        const { deviceId, command, parameters } = data;
        
        if (!deviceId || !command) {
          socket.emit('error', { message: 'Device ID and command are required' });
          return;
        }

        // Send command to specific device
        io.to(`device:${deviceId}`).emit('command:received', {
          command,
          parameters: parameters || {},
          commandId: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toISOString()
        });

        logger.info(`Real-time command sent to device ${deviceId}: ${command}`);
        
        socket.emit('command:sent', {
          message: 'Command sent successfully',
          deviceId,
          command
        });

      } catch (error) {
        logger.error('Command execution error:', error);
        socket.emit('error', { message: 'Command execution failed' });
      }
    });

    // Handle command acknowledgment from devices
    socket.on('command:acknowledge', (data) => {
      try {
        const { commandId, executed, result } = data;
        
        if (!socket.deviceId) {
          socket.emit('error', { message: 'Device not registered' });
          return;
        }

        // Notify admins about command completion
        io.to('admin').emit('command:completed', {
          deviceId: socket.deviceId,
          commandId,
          executed,
          result,
          completedAt: new Date().toISOString()
        });

        logger.info(`Command acknowledged by device ${socket.deviceId}: ${commandId}`);

      } catch (error) {
        logger.error('Command acknowledgment error:', error);
        socket.emit('error', { message: 'Acknowledgment failed' });
      }
    });

    // Handle device status updates
    socket.on('device:status', (data) => {
      try {
        if (!socket.deviceId) {
          socket.emit('error', { message: 'Device not registered' });
          return;
        }

        // Broadcast status update to admins
        io.to('admin').emit('device:status_update', {
          deviceId: socket.deviceId,
          status: data,
          timestamp: new Date().toISOString()
        });

        logger.debug(`Status update from device ${socket.deviceId}`);

      } catch (error) {
        logger.error('Device status update error:', error);
        socket.emit('error', { message: 'Status update failed' });
      }
    });

    // Handle device ping/heartbeat
    socket.on('device:ping', () => {
      if (socket.deviceId) {
        socket.emit('device:pong', { timestamp: new Date().toISOString() });
        
        // Update device connection info
        const deviceInfo = connectedDevices.get(socket.deviceId);
        if (deviceInfo) {
          deviceInfo.lastPing = new Date().toISOString();
          connectedDevices.set(socket.deviceId, deviceInfo);
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.deviceId) {
        // Remove device from connected devices
        connectedDevices.delete(socket.deviceId);
        
        // Notify admins about device disconnection
        io.to('admin').emit('device:disconnected', {
          deviceId: socket.deviceId,
          reason,
          disconnectedAt: new Date().toISOString()
        });
        
        logger.info(`Device disconnected: ${socket.deviceId}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  logger.info('WebSocket server initialized');
}

// Send command to device via WebSocket
function sendCommandToDevice(deviceId, command, parameters = {}) {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }

  const commandData = {
    command,
    parameters,
    commandId: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString()
  };

  io.to(`device:${deviceId}`).emit('command:received', commandData);
  
  logger.info(`Command sent to device ${deviceId} via WebSocket: ${command}`);
  return commandData.commandId;
}

// Broadcast message to all admins
function broadcastToAdmins(event, data) {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }

  io.to('admin').emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
}

// Broadcast message to all connected devices
function broadcastToDevices(event, data) {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }

  // Send to all device rooms
  for (const deviceId of connectedDevices.keys()) {
    io.to(`device:${deviceId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

// Get connected devices list
function getConnectedDevices() {
  return Array.from(connectedDevices.entries()).map(([deviceId, info]) => ({
    deviceId,
    ...info
  }));
}

// Check if device is connected
function isDeviceConnected(deviceId) {
  return connectedDevices.has(deviceId);
}

module.exports = {
  setupWebSocket,
  sendCommandToDevice,
  broadcastToAdmins,
  broadcastToDevices,
  getConnectedDevices,
  isDeviceConnected
};
