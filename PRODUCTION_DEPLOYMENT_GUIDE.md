# Production Deployment Guide - Rate Limiting & CAPTCHA System

## 🚀 Deployment Checklist

### Phase 1: Server Setup

#### 1.1 Environment Configuration
- [ ] Set up production server (AWS EC2, DigitalOcean, etc.)
- [ ] Install Node.js 18+ and npm/yarn
- [ ] Configure environment variables:
  ```bash
  EXPO_PUBLIC_RECAPTCHA_SITE_KEY=6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7
  EXPO_PUBLIC_RECAPTCHA_SECRET_KEY=6Ld-ALYrAAAAABAjYRpVcK7j6TZPIzcSjBFD7FYr
  APP_URL=https://your-production-domain.com
  NODE_ENV=production
  PORT=3000
  ```

#### 1.2 Security Setup
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Configure CORS for your mobile app domains
- [ ] Set up reverse proxy (nginx/Apache)

#### 1.3 Database & Redis
- [ ] Set up PostgreSQL/MongoDB for incident storage
- [ ] Configure Redis for rate limiting and session storage
- [ ] Set up database migrations
- [ ] Configure backup strategies

### Phase 2: Mobile App Configuration

#### 2.1 Environment Variables
Add to your `.env` file:
```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com
EXPO_PUBLIC_RECAPTCHA_SITE_KEY=6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7
EXPO_PUBLIC_CAPTCHA_ENABLED=true
```

#### 2.2 App Configuration
- [ ] Update API endpoints in mobile app
- [ ] Test CAPTCHA functionality in staging
- [ ] Verify rate limiting works correctly
- [ ] Test error handling scenarios

### Phase 3: Testing & Validation

#### 3.1 Functionality Tests
```bash
# Test CAPTCHA verification
curl -X POST https://your-api.com/api/verify-captcha \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token","action":"test"}'

# Test rate limiting
for i in {1..5}; do
  curl -X POST https://your-api.com/api/incidents \
    -H "Content-Type: application/json" \
    -d '{"token":"test","deviceId":"test-device","incidentData":{"description":"Test"}}'
done
```

#### 3.2 Security Tests
- [ ] Verify CAPTCHA tokens are validated server-side
- [ ] Test rate limiting enforcement
- [ ] Verify CORS configuration
- [ ] Test SSL/TLS configuration
- [ ] Run security audit: `npm audit && snyk test`

#### 3.3 Performance Tests
- [ ] Load test the API endpoints
- [ ] Monitor response times
- [ ] Test Redis performance
- [ ] Verify database performance

### Phase 4: Monitoring & Logging

#### 4.1 Application Monitoring
```javascript
// Production logging setup
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### 4.2 Security Monitoring
- [ ] Set up rate limit violation alerts
- [ ] Monitor CAPTCHA failure rates
- [ ] Track suspicious device patterns
- [ ] Log all security events

#### 4.3 Health Checks
```bash
# Health check endpoint
curl https://your-api.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## 📊 Performance Optimization

### 1. Redis Configuration
```redis
# redis.conf optimizations
maxmemory 256mb
maxmemory-policy allkeys-lru
tcp-keepalive 60
timeout 300
```

### 2. API Rate Limiting
```javascript
// Production rate limiting with Redis
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
```

### 3. Database Optimization
```sql
-- Create indexes for incident queries
CREATE INDEX idx_incidents_device_id ON incidents(device_id);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_severity ON incidents(severity);

-- Create index for security events
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_device_id ON security_events(device_id);
```

## 🛡️ Security Best Practices

### 1. API Security
- [ ] Use HTTPS everywhere
- [ ] Implement API key authentication
- [ ] Add request signing for sensitive operations
- [ ] Use helmet.js for security headers
- [ ] Implement CSRF protection

### 2. Rate Limiting Security
- [ ] Use Redis for distributed rate limiting
- [ ] Implement progressive delays for repeated violations
- [ ] Monitor and alert on abuse patterns
- [ ] Implement IP whitelisting for trusted sources

### 3. CAPTCHA Security
- [ ] Always verify tokens server-side
- [ ] Use score-based verification for reCAPTCHA v3
- [ ] Monitor CAPTCHA failure rates
- [ ] Implement fallback verification methods

## 📈 Monitoring & Alerts

### 1. Key Metrics to Monitor
```json
{
  "api_response_time": "< 200ms p95",
  "captcha_success_rate": "> 95%",
  "rate_limit_violations": "< 1% of requests",
  "error_rate": "< 1%",
  "database_connection_time": "< 50ms",
  "redis_response_time": "< 10ms"
}
```

### 2. Alert Configuration
```yaml
# Example alerts.yml
alerts:
  - name: "High CAPTCHA Failure Rate"
    condition: "captcha_failure_rate > 10%"
    severity: "warning"
    
  - name: "Rate Limit Violations Spike"
    condition: "rate_limit_violations > 5% for 5 minutes"
    severity: "critical"
    
  - name: "API Response Time High"
    condition: "api_response_time_p95 > 500ms for 2 minutes"
    severity: "warning"
```

## 🔧 Troubleshooting Guide

### Common Issues

#### 1. CAPTCHA Not Loading
```bash
# Check network connectivity
curl -I https://www.google.com/recaptcha/api.js

# Verify site key configuration
grep -r "RECAPTCHA_SITE_KEY" .env
```

#### 2. Rate Limiting Not Working
```bash
# Check Redis connection
redis-cli ping

# Verify rate limit storage
redis-cli keys "incident_rate_*"
```

#### 3. High Response Times
```bash
# Check database performance
SELECT COUNT(*) FROM incidents WHERE created_at > NOW() - INTERVAL '1 hour';

# Monitor Redis performance
redis-cli --latency
```

### Log Analysis
```bash
# Search for rate limit violations
grep "rate_limit_exceeded" /var/log/app/security.log

# Monitor CAPTCHA failures
grep "captcha_failed" /var/log/app/security.log | tail -100

# Check API response times
grep "response_time" /var/log/app/access.log | awk '{print $NF}' | sort -n
```

## 📋 Go-Live Checklist

### Final Validation
- [ ] All environment variables configured
- [ ] SSL certificates installed and valid
- [ ] Database migrations completed
- [ ] Redis configured and running
- [ ] CAPTCHA keys tested and working
- [ ] Rate limiting tested and enforced
- [ ] Monitoring and alerts configured
- [ ] Backup and recovery procedures tested
- [ ] Security audit completed
- [ ] Performance baseline established

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Verify CAPTCHA functionality
- [ ] Test rate limiting enforcement
- [ ] Check security event logging
- [ ] Monitor performance metrics
- [ ] Validate mobile app integration
- [ ] Test incident reporting flow
- [ ] Verify backup procedures

## 🆘 Emergency Procedures

### Rate Limiting Issues
```bash
# Temporarily disable rate limiting
redis-cli flushdb

# Increase rate limits temporarily
# Update environment variables and restart
```

### CAPTCHA Issues
```bash
# Switch to backup verification method
export EXPO_PUBLIC_CAPTCHA_ENABLED=false

# Restart application
pm2 restart all
```

### Performance Issues
```bash
# Scale horizontally
pm2 scale app +2

# Monitor resource usage
htop
iotop
```

This deployment guide ensures a secure, performant, and monitored production environment for your rate limiting and CAPTCHA system.
