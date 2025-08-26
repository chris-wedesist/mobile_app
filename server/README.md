# DESIST Management Server

A comprehensive remote management server for the DESIST mobile app, providing secure device management, command execution, and real-time monitoring capabilities.

## 🚀 Features

### Device Management

- **Device Registration & Authentication** - Secure device onboarding with JWT tokens
- **Real-time Status Monitoring** - Live device status updates and health metrics
- **Configuration Management** - Remote configuration updates and versioning
- **Threat Level Assessment** - Automatic threat detection and scoring

### Command & Control

- **Remote Command Execution** - Execute commands on devices remotely
- **Bulk Operations** - Send commands to multiple devices simultaneously
- **Command History & Tracking** - Complete audit trail of all commands
- **Real-time WebSocket Communication** - Instant command delivery

### Admin Dashboard

- **Comprehensive Analytics** - Device statistics and performance metrics
- **Device Health Scoring** - Automated health assessment
- **Activity Monitoring** - Real-time activity feeds and alerts
- **Multi-filter Device Management** - Advanced filtering and search

### Security & Compliance

- **JWT Authentication** - Secure token-based authentication
- **Data Encryption** - Encrypted data storage and transmission
- **Audit Logging** - Complete activity logging for compliance
- **Rate Limiting** - Protection against abuse and attacks

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- SQLite 3
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and setup the server:**

   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize Database:**

   ```bash
   npm run db:migrate
   ```

4. **Start Development Server:**

   ```bash
   npm run dev
   ```

5. **Start Production Server:**
   ```bash
   npm start
   ```

## 🔧 Environment Variables

### Required Configuration

```env
# Server
PORT=3000
NODE_ENV=development
HOST=localhost

# Database
DATABASE_PATH=./data/desist.db

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Admin Access
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-secure-password
```

### Optional Configuration

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:19006,exp://localhost:19000

# WebSocket
WEBSOCKET_ENABLED=true

# Logging
LOG_LEVEL=info
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| POST   | `/api/auth/register`    | Register new device  |
| POST   | `/api/auth/login`       | Device login         |
| POST   | `/api/auth/refresh`     | Refresh access token |
| POST   | `/api/auth/logout`      | Device logout        |
| POST   | `/api/auth/admin/login` | Admin login          |

### Device Management

| Method | Endpoint                               | Description           |
| ------ | -------------------------------------- | --------------------- |
| GET    | `/api/devices/:deviceId/status`        | Get device status     |
| PUT    | `/api/devices/:deviceId/config`        | Update device config  |
| POST   | `/api/devices/:deviceId/sync`          | Sync device state     |
| POST   | `/api/devices/:deviceId/status-report` | Receive status report |
| POST   | `/api/devices/:deviceId/wipe`          | Remote wipe device    |

### Command Control

| Method | Endpoint                                                 | Description           |
| ------ | -------------------------------------------------------- | --------------------- |
| GET    | `/api/devices/:deviceId/commands`                        | Get pending commands  |
| POST   | `/api/devices/:deviceId/commands`                        | Create new command    |
| POST   | `/api/devices/:deviceId/commands/:commandId/acknowledge` | Acknowledge command   |
| GET    | `/api/devices/:deviceId/commands/history`                | Get command history   |
| POST   | `/api/devices/bulk`                                      | Bulk command creation |

### Admin Dashboard

| Method | Endpoint                        | Description        |
| ------ | ------------------------------- | ------------------ |
| GET    | `/api/admin/dashboard`          | Dashboard data     |
| GET    | `/api/admin/devices`            | Device management  |
| GET    | `/api/admin/devices/:deviceId`  | Device details     |
| POST   | `/api/admin/commands/broadcast` | Broadcast commands |
| GET    | `/api/admin/stats`              | System statistics  |

## 🔌 WebSocket Events

### Device Events

```javascript
// Device Registration
socket.emit('device:register', {
  deviceId: 'device_123',
  appVersion: '1.0.0',
  platform: 'ios',
});

// Status Updates
socket.emit('device:status', {
  isActive: true,
  batteryLevel: 85,
  threatLevel: 'low',
});

// Command Acknowledgment
socket.emit('command:acknowledge', {
  commandId: 'cmd_123',
  executed: true,
  result: { success: true },
});
```

### Admin Events

```javascript
// Admin Authentication
socket.emit('admin:authenticate', {
  token: 'admin_jwt_token',
});

// Execute Command
socket.emit('command:execute', {
  deviceId: 'device_123',
  command: 'activate',
  parameters: {},
});
```

## 📊 Database Schema

### Core Tables

- **devices** - Device registration and status
- **device_configs** - Configuration history and versioning
- **commands** - Command queue and execution history
- **sync_logs** - Device synchronization logs
- **status_reports** - Device status reports
- **admin_users** - Admin user management
- **device_tokens** - JWT token management

## 🚦 Health Scoring Algorithm

Device health scores (0-100) are calculated based on:

- **Threat Level**: High (-40), Medium (-20), Low (0)
- **Online Status**: Offline (-30)
- **Last Seen**: >24h (-20), >12h (-10)
- **Pending Commands**: >5 (-15), >2 (-5)

## 🔐 Security Features

### Authentication

- JWT-based device authentication
- Refresh token rotation
- Admin role-based access control
- Token expiration and cleanup

### Protection

- Rate limiting on all endpoints
- CORS configuration
- Helmet security headers
- Input validation and sanitization

### Encryption

- Configurable data encryption
- Secure password hashing (bcrypt)
- Environment variable protection

## 📈 Monitoring & Logging

### Winston Logging

- Structured JSON logging
- Log rotation and archiving
- Error tracking and reporting
- Performance monitoring

### Metrics Tracked

- Device connectivity stats
- Command execution rates
- Response time analytics
- Threat level distribution

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Configure secure JWT secrets
3. Set up SSL/TLS certificates
4. Configure production database
5. Set up process manager (PM2)

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
JWT_SECRET=secure-production-secret
ADMIN_PASSWORD=secure-admin-password
DATABASE_PATH=/data/desist.db
LOG_LEVEL=warn
```

## 🤝 API Integration

### Mobile App Integration

Update the mobile app's `blankScreenStealth.ts` to use real API endpoints:

```typescript
// Replace the mock implementations with real API calls
private async syncWithServer(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/devices/${this.config.remoteManagement.deviceId}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getDeviceToken()}`,
        'Content-Type': 'application/json',
        'X-Device-ID': this.config.remoteManagement.deviceId,
      },
      body: JSON.stringify({
        deviceId: this.config.remoteManagement.deviceId,
        timestamp: new Date(),
        config: this.config,
        performanceMetrics: this.config.performanceMetrics
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Process pending commands from server
      if (data.pendingCommands) {
        for (const command of data.pendingCommands) {
          await this.executeRemoteCommand(command);
        }
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

## 📞 Support

For support and questions:

- Check the API documentation at `/api`
- Review server logs in `./logs/`
- Monitor health status at `/health`

## 📄 License

MIT License - see LICENSE file for details.

---

_DESIST Management Server v1.0.0_  
_Secure Device Management & Remote Control_
