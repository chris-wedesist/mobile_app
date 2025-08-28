# Production Deployment Guide for DESIST! Push Notifications

This guide provides step-by-step instructions for deploying the push notification system to production.

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create `.env` file from `.env.example`
- [ ] Set up production database (PostgreSQL/MongoDB)
- [ ] Configure Redis for caching (optional but recommended)
- [ ] Set up monitoring (Sentry, DataDog, etc.)

### 2. Notification Service Configuration
- [ ] Obtain Expo Project ID from Expo Console
- [ ] Generate Expo Access Token for server-side operations
- [ ] Configure FCM Server Key for Android (if using native)
- [ ] Set up APNS credentials for iOS (if using native)

### 3. Security Configuration
- [ ] Generate secure encryption keys (32+ characters)
- [ ] Set up JWT secrets
- [ ] Configure rate limiting parameters
- [ ] Set up SSL/TLS certificates

## 📋 Step-by-Step Deployment

### Step 1: Expo Configuration

1. **Create Expo Account and Project**
   ```bash
   npm install -g @expo/cli
   expo login
   expo create desist-mobile --template blank-typescript
   cd desist-mobile
   ```

2. **Configure app.json/app.config.js**
   ```json
   {
     "expo": {
       "name": "DESIST!",
       "slug": "desist-mobile",
       "version": "1.0.0",
       "platforms": ["ios", "android", "web"],
       "notification": {
         "icon": "./assets/notification-icon.png",
         "color": "#FF4444",
         "iosDisplayInForeground": true,
         "androidMode": "default",
         "androidCollapsedTitle": "DESIST! Alert"
       },
       "android": {
         "package": "com.desist.mobile",
         "googleServicesFile": "./google-services.json",
         "useNextNotificationsApi": true
       },
       "ios": {
         "bundleIdentifier": "com.desist.mobile",
         "infoPlist": {
           "UIBackgroundModes": ["background-fetch", "remote-notification"]
         }
       }
     }
   }
   ```

3. **Install Push Notification Dependencies**
   ```bash
   npx expo install expo-notifications expo-device
   ```

### Step 2: Database Setup

#### Option A: PostgreSQL
```sql
-- Create database
CREATE DATABASE desist_notifications;

-- Create user
CREATE USER desist_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE desist_notifications TO desist_user;

-- Run schema creation
psql -d desist_notifications -f src/database/schema.sql
```

#### Option B: MongoDB
```javascript
// Connect to MongoDB
use desist_notifications

// Create collections with indexes
db.createCollection("deviceRegistrations")
db.createCollection("notificationLogs")
db.createCollection("complianceEvents")

// Create indexes (run the index commands from NotificationDatabase.ts)
```

### Step 3: Environment Configuration

Create `.env` file in production:
```bash
# Required Production Variables
NODE_ENV=production
EXPO_PROJECT_ID=your-actual-expo-project-id
EXPO_ACCESS_TOKEN=your-expo-access-token
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ENCRYPTION_KEY=your-32-character-encryption-key-here
JWT_SECRET=your-32-character-jwt-secret-here

# Optional but Recommended
REDIS_URL=redis://localhost:6379
SENTRY_DSN=your-sentry-dsn
API_BASE_URL=https://api.desist.app
COMPLIANCE_WEBHOOK_URL=https://compliance.desist.app/webhook

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REGISTRATION_MAX=10

# Compliance
GDPR_RETENTION_DAYS=365
AUDIT_LOG_RETENTION_DAYS=2555
```

### Step 4: Server Deployment

#### Using Docker
1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env
       depends_on:
         - postgres
         - redis
     
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: desist_notifications
         POSTGRES_USER: desist_user
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data
   
   volumes:
     postgres_data:
     redis_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

#### Using Node.js Process Manager (PM2)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'desist-notifications',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Load Balancer & SSL Setup

#### Nginx Configuration
```nginx
upstream desist_api {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001; # If running multiple instances
}

server {
    listen 443 ssl http2;
    server_name api.desist.app;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location /api/notifications/ {
        proxy_pass http://desist_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=10 nodelay;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://desist_api/health;
        access_log off;
    }
}

# Rate limiting zones
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
}
```

### Step 6: Monitoring Setup

#### Health Check Endpoint
```typescript
// Add to your Express app
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await database.getHealthMetrics();
    
    // Check Redis connection (if used)
    if (redis) {
      await redis.ping();
    }
    
    // Check notification service status
    const stats = await productionPushService.getServiceStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redis ? 'connected' : 'not_configured',
      pushService: stats.isConfigured ? 'configured' : 'error',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

#### Sentry Integration
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add error handling middleware
app.use(Sentry.Handlers.errorHandler());
```

### Step 7: Testing Production Setup

#### 1. Test Notification Endpoints
```bash
# Test device registration
curl -X POST https://api.desist.app/api/notifications/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[test-token]",
    "platform": "ios",
    "deviceId": "test-device-123",
    "appVersion": "1.0.0"
  }'

# Test emergency notification
curl -X POST https://api.desist.app/api/notifications/emergency \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Emergency Alert",
    "body": "This is a test emergency notification"
  }'
```

#### 2. Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'https://api.desist.app'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Register devices"
    requests:
      - post:
          url: "/api/notifications/register"
          json:
            token: "ExponentPushToken[{{ \$randomString() }}]"
            platform: "ios"
            deviceId: "test-{{ \$randomString() }}"
            appVersion: "1.0.0"
EOF

# Run load test
artillery run load-test.yml
```

### Step 8: Backup and Recovery

#### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U desist_user desist_notifications > backup_$(date +%Y%m%d).sql

# MongoDB backup
mongodump --db desist_notifications --out backup_$(date +%Y%m%d)
```

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U desist_user desist_notifications > $BACKUP_DIR/db_$DATE.sql

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql s3://desist-backups/database/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql"
```

### Step 9: Performance Optimization

#### Database Optimization
```sql
-- Add database indexes for performance
CREATE INDEX CONCURRENTLY idx_device_active_updated 
    ON device_registrations (is_active, last_updated);

CREATE INDEX CONCURRENTLY idx_notification_logs_recent 
    ON notification_logs (sent_at DESC) 
    WHERE sent_at > NOW() - INTERVAL '30 days';

-- Analyze query performance
ANALYZE device_registrations;
ANALYZE notification_logs;
ANALYZE compliance_events;
```

#### Redis Caching (Optional)
```typescript
// Add Redis caching for device registrations
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache device preferences
const cacheKey = `device_prefs:${deviceId}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Cache for 1 hour
await redis.setex(cacheKey, 3600, JSON.stringify(preferences));
```

## 🔍 Post-Deployment Monitoring

### Key Metrics to Monitor
- Notification delivery rate (target: >95%)
- API response times (target: <200ms)
- Database connection pool usage
- Memory and CPU usage
- Error rates by endpoint
- Device registration trends

### Alerts to Set Up
- API error rate > 5%
- Database connection failures
- Push notification delivery failures > 10%
- High memory/CPU usage
- Certificate expiration warnings

### Daily Maintenance Tasks
- [ ] Check application logs for errors
- [ ] Monitor notification delivery rates
- [ ] Review database performance
- [ ] Check backup completion
- [ ] Verify SSL certificate status

## 🚨 Troubleshooting

### Common Issues
1. **Push tokens not working**: Verify Expo project ID and access token
2. **Database connection errors**: Check connection string and firewall
3. **High error rates**: Review rate limiting and input validation
4. **Memory leaks**: Monitor Node.js event loop and garbage collection

### Emergency Procedures
1. **Service outage**: Switch to backup servers, check health endpoints
2. **Database failure**: Restore from latest backup, check replication
3. **Certificate expiration**: Deploy new certificates, restart services
4. **DDoS attack**: Enable DDoS protection, increase rate limits

This deployment guide ensures your DESIST! push notification system is production-ready with proper security, monitoring, and scalability considerations.
