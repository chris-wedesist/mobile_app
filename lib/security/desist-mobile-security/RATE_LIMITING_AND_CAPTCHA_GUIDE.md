# Rate Limiting and CAPTCHA Implementation Guide

This document provides comprehensive guidance for implementing and configuring rate limiting and CAPTCHA functionality in the mobile app.

## Overview

The rate limiting and CAPTCHA system provides multiple layers of security protection:

1. **Device-based Rate Limiting** - Prevents abuse by limiting actions per device per time window
2. **Human Verification** - Uses Google reCAPTCHA to prevent automated attacks
3. **Configurable Security Policies** - Centralized configuration for different security limits
4. **Comprehensive Logging** - Security event tracking for monitoring and analysis

## Architecture

### Core Components

#### 1. RateLimiter (`lib/security/rateLimiter.ts`)
- Time-window based rate limiting using AsyncStorage
- Configurable limits per action type
- Automatic cleanup of expired rate limit data
- Pre-configured limiters for common use cases

#### 2. Device Utilities (`lib/security/deviceUtils.ts`)
- Stable device identification for rate limiting
- Privacy-compliant device fingerprinting
- Fallback mechanisms for device ID generation

#### 3. Security Configuration (`lib/security/securityConfig.ts`)
- Centralized security policy management
- Environment variable integration
- Configuration validation

#### 4. Enhanced Components (`components/security/ReportIncidentWithRateLimitAndCaptcha.tsx`)
- User-friendly rate limiting with feedback
- Integrated CAPTCHA verification
- Comprehensive error handling

## Usage

### Basic Rate Limiting

```typescript
import { incidentReportLimiter } from '../lib/security/rateLimiter';
import { getDeviceId } from '../lib/security/deviceUtils';

const deviceId = await getDeviceId();

// Check if action is allowed
const canSubmit = await incidentReportLimiter.canPerformAction(deviceId);
if (!canSubmit) {
  // Show rate limit exceeded message
  return;
}

// Perform the action
await performAction();

// Record the action for rate limiting
await incidentReportLimiter.recordAction(deviceId);
```

### Custom Rate Limiter

```typescript
import { RateLimiter } from '../lib/security/rateLimiter';

const customLimiter = new RateLimiter({
  maxAttempts: 10,
  windowHours: 24,
  keyPrefix: 'custom_action'
});

const deviceId = await getDeviceId();
const allowed = await customLimiter.canPerformAction(deviceId);
```

### CAPTCHA Integration

```typescript
import ReCaptcha from 'react-native-recaptcha-that-works';

const [captchaVerified, setCaptchaVerified] = useState(false);

const onVerifyCaptcha = (token: string) => {
  if (token) {
    setCaptchaVerified(true);
    // Proceed with protected action
  }
};

<ReCaptcha
  siteKey={process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY}
  baseUrl={process.env.EXPO_PUBLIC_APP_URL}
  onVerify={onVerifyCaptcha}
  show={showCaptcha}
/>
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Google reCAPTCHA Configuration
EXPO_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
EXPO_PUBLIC_APP_URL=https://your-app-domain.com

# Security Features
EXPO_PUBLIC_CAPTCHA_ENABLED=true
```

### Rate Limit Configuration

Default rate limits can be customized in `lib/security/securityConfig.ts`:

```typescript
rateLimiting: {
  incidentReports: {
    maxAttempts: 3,      // 3 reports per hour
    windowHours: 1,
  },
  loginAttempts: {
    maxAttempts: 5,      // 5 login attempts per hour
    windowHours: 1,
  },
  passwordReset: {
    maxAttempts: 3,      // 3 password resets per day
    windowHours: 24,
  },
}
```

## Security Considerations

### Rate Limiting Best Practices

1. **Device Identification**
   - Uses stable but privacy-compliant device fingerprinting
   - Fallback mechanisms for reliability
   - No personally identifiable information stored

2. **Time Windows**
   - Uses hour-based windows for incident reports
   - Daily windows for sensitive operations (password reset)
   - Automatic cleanup prevents storage bloat

3. **Error Handling**
   - Graceful degradation when storage fails
   - User-friendly error messages
   - No sensitive information in error logs

### CAPTCHA Best Practices

1. **Integration Points**
   - Required for incident reporting
   - Optional for low-risk operations
   - Re-verification for repeated actions

2. **User Experience**
   - Clear feedback on verification status
   - Accessible verification process
   - Fallback for CAPTCHA failures

3. **Security Validation**
   - Server-side token verification (implement as needed)
   - Token expiration handling
   - Protection against replay attacks

## Testing

### Rate Limiter Tests

```bash
npm test -- __tests__/security/rateLimiter.test.ts
```

Test coverage includes:
- Rate limit enforcement
- Time window calculations
- Error handling scenarios
- Edge cases and boundary conditions

### Manual Testing

1. **Rate Limiting**
   - Submit 3 incident reports quickly
   - Verify 4th report is blocked
   - Wait 1 hour and verify reset

2. **CAPTCHA**
   - Verify CAPTCHA appears on form submission
   - Test successful verification flow
   - Test CAPTCHA failure scenarios

## Monitoring and Analytics

### Security Events

The system logs security events for monitoring:

```typescript
// Example security event
{
  event_type: 'rate_limit_exceeded',
  device_id: 'device123',
  metadata: {
    action: 'incident_report',
    attempts: 4,
    limit: 3,
    window: '1 hour'
  },
  severity: 'medium',
  timestamp: '2024-01-01T12:00:00Z'
}
```

### Metrics to Monitor

1. **Rate Limit Violations**
   - Frequency of rate limit hits
   - Devices with repeated violations
   - Time patterns of violations

2. **CAPTCHA Performance**
   - Verification success rates
   - User abandonment after CAPTCHA
   - CAPTCHA error rates

3. **Security Incidents**
   - Total incident reports per period
   - Geographic distribution
   - Device behavior patterns

## Implementation Checklist

### Initial Setup
- [ ] Configure Google reCAPTCHA site key
- [ ] Set up environment variables
- [ ] Install required dependencies
- [ ] Configure AsyncStorage permissions

### Integration
- [ ] Import rate limiting utilities
- [ ] Add CAPTCHA components to forms
- [ ] Implement device identification
- [ ] Add user feedback for rate limits

### Testing
- [ ] Test rate limiting functionality
- [ ] Verify CAPTCHA integration
- [ ] Test error scenarios
- [ ] Validate security configuration

### Production
- [ ] Monitor rate limit violations
- [ ] Track CAPTCHA success rates
- [ ] Review security event logs
- [ ] Adjust limits based on usage patterns

## Troubleshooting

### Common Issues

1. **CAPTCHA Not Loading**
   - Verify site key configuration
   - Check base URL setting
   - Ensure network connectivity

2. **Rate Limits Not Working**
   - Check AsyncStorage permissions
   - Verify device ID generation
   - Review time window calculations

3. **Storage Issues**
   - Monitor AsyncStorage usage
   - Implement cleanup routines
   - Handle storage quota limits

### Debug Tips

1. **Enable Verbose Logging**
   ```typescript
   console.log('Rate limit check:', {
     deviceId,
     canPerform: await limiter.canPerformAction(deviceId),
     remaining: await limiter.getRemainingAttempts(deviceId)
   });
   ```

2. **Test with Different Devices**
   - Clear AsyncStorage to reset limits
   - Use different device simulators
   - Test across different time zones

## Security Compliance

This implementation follows:
- OWASP Mobile Security Guidelines
- GDPR privacy requirements
- Industry standard rate limiting practices
- Accessibility guidelines for CAPTCHA

## Support

For questions or issues with rate limiting and CAPTCHA functionality:
1. Review this documentation
2. Check the test files for examples
3. Consult the security configuration
4. Review security event logs for insights

## Server-Side CAPTCHA Verification

### Secret Key Configuration

The reCAPTCHA secret key is used for server-side verification of CAPTCHA tokens. This provides an additional layer of security beyond client-side validation.

#### Environment Variables

Add these to your server environment:

```env
# reCAPTCHA Keys
EXPO_PUBLIC_RECAPTCHA_SITE_KEY=6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7
EXPO_PUBLIC_RECAPTCHA_SECRET_KEY=6Ld-ALYrAAAAABAjYRpVcK7j6TZPIzcSjBFD7FYr
```

**Security Note**: The secret key should ONLY be used on your server/backend. Never expose it in client-side code.

### Server-Side Verification

```typescript
import { verifyCaptchaToken, verifyWithSecurityChecks } from '../lib/security/captchaVerification';

// Basic verification
const result = await verifyCaptchaToken(token);
if (result.success) {
  // Token is valid
  proceedWithAction();
}

// Advanced verification with score checking (reCAPTCHA v3)
const advancedResult = await verifyWithSecurityChecks(
  token,
  'submit_incident', // expected action
  0.5, // minimum score
  clientIP
);
```

### API Endpoint Example

```typescript
// Express.js endpoint for CAPTCHA verification
app.post('/api/verify-captcha', async (req, res) => {
  const { token, action } = req.body;
  
  const result = await verifyWithSecurityChecks(
    token,
    action,
    0.5,
    req.ip
  );
  
  if (result.success) {
    res.json({ success: true, score: result.score });
  } else {
    res.status(400).json({ success: false, error: result.reason });
  }
});
```

### Security Best Practices

1. **Never expose the secret key** in client-side code
2. **Always verify tokens server-side** for critical operations
3. **Use score-based verification** for reCAPTCHA v3
4. **Log verification attempts** for security monitoring
5. **Set appropriate score thresholds** based on your security requirements

### Integration with Mobile App

The mobile app should send the CAPTCHA token to your server for verification:

```typescript
// In your React Native component
const submitWithCaptcha = async (token: string) => {
  try {
    const response = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token,
        action: 'submit_incident',
        data: formData
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Proceed with the protected action
    }
  } catch (error) {
    // Handle verification error
  }
};
```
