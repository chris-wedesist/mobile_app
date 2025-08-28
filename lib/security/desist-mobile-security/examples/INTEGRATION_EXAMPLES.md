# Rate Limiting and CAPTCHA Integration Examples

This document provides practical examples for integrating rate limiting and CAPTCHA functionality into existing forms and user actions.

## Example 1: Login Form with Rate Limiting

```typescript
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { loginAttemptLimiter } from '../lib/security/rateLimiter';
import { getDeviceId } from '../lib/security/deviceUtils';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  useEffect(() => {
    const initializeRateLimit = async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      const remaining = await loginAttemptLimiter.getRemainingAttempts(id);
      setRemainingAttempts(remaining);
    };
    initializeRateLimit();
  }, []);

  const handleLogin = async () => {
    const canAttempt = await loginAttemptLimiter.canPerformAction(deviceId);
    if (!canAttempt) {
      const resetTime = await loginAttemptLimiter.getResetTime(deviceId);
      Alert.alert(
        'Too Many Attempts',
        `Please try again after ${resetTime.toLocaleTimeString()}`
      );
      return;
    }

    try {
      // Perform login
      const success = await performLogin(email, password);
      
      if (!success) {
        // Record failed attempt
        await loginAttemptLimiter.recordAction(deviceId);
        const remaining = await loginAttemptLimiter.getRemainingAttempts(deviceId);
        setRemainingAttempts(remaining);
        
        Alert.alert('Login Failed', `${remaining} attempts remaining`);
      }
    } catch (error) {
      await loginAttemptLimiter.recordAction(deviceId);
      Alert.alert('Error', 'Login failed');
    }
  };

  return (
    <View>
      {remainingAttempts !== null && remainingAttempts < 5 && (
        <Text style={{ color: 'orange' }}>
          Warning: {remainingAttempts} login attempts remaining
        </Text>
      )}
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        onPress={handleLogin}
        disabled={remainingAttempts === 0}
      >
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Example 2: Password Reset with CAPTCHA

```typescript
import React, { useState } from 'react';
import ReCaptcha from 'react-native-recaptcha-that-works';
import { passwordResetLimiter } from '../lib/security/rateLimiter';
import { getDeviceId } from '../lib/security/deviceUtils';

export function PasswordResetForm() {
  const [email, setEmail] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handlePasswordReset = async () => {
    const deviceId = await getDeviceId();
    
    // Check rate limit (3 resets per 24 hours)
    const canReset = await passwordResetLimiter.canPerformAction(deviceId);
    if (!canReset) {
      Alert.alert('Limit Reached', 'Maximum password resets per day exceeded');
      return;
    }

    // Require CAPTCHA for password reset
    if (!captchaVerified) {
      setShowCaptcha(true);
      return;
    }

    try {
      await sendPasswordResetEmail(email);
      await passwordResetLimiter.recordAction(deviceId);
      
      Alert.alert('Success', 'Password reset email sent');
      setCaptchaVerified(false); // Reset for next use
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
      />
      
      <TouchableOpacity onPress={handlePasswordReset}>
        <Text>
          {captchaVerified ? 'Send Reset Email' : 'Verify & Send Reset Email'}
        </Text>
      </TouchableOpacity>

      <ReCaptcha
        siteKey={process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7'}
        baseUrl={process.env.EXPO_PUBLIC_APP_URL}
        onVerify={(token) => {
          if (token) {
            setCaptchaVerified(true);
            setShowCaptcha(false);
          }
        }}
        show={showCaptcha}
        onExpire={() => setCaptchaVerified(false)}
      />
    </View>
  );
}
```

## Example 3: Custom Rate Limiter for API Calls

```typescript
import { RateLimiter } from '../lib/security/rateLimiter';
import { getDeviceId } from '../lib/security/deviceUtils';

// Create API-specific rate limiter
const apiCallLimiter = new RateLimiter({
  maxAttempts: 100,
  windowHours: 1,
  keyPrefix: 'api_calls'
});

export async function makeProtectedAPICall(endpoint: string, data: any) {
  const deviceId = await getDeviceId();
  
  const canMakeCall = await apiCallLimiter.canPerformAction(deviceId);
  if (!canMakeCall) {
    throw new Error('API rate limit exceeded. Please try again later.');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Record successful API call
    await apiCallLimiter.recordAction(deviceId);
    
    return response.json();
  } catch (error) {
    // Still record the attempt even if it failed
    await apiCallLimiter.recordAction(deviceId);
    throw error;
  }
}

// Usage in component
export function DataSubmissionForm() {
  const [data, setData] = useState({});

  const handleSubmit = async () => {
    try {
      const result = await makeProtectedAPICall('/api/submit', data);
      Alert.alert('Success', 'Data submitted successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      {/* Form fields */}
      <TouchableOpacity onPress={handleSubmit}>
        <Text>Submit Data</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Example 4: Feedback Form with Progressive Security

```typescript
import React, { useState, useEffect } from 'react';
import { incidentReportLimiter } from '../lib/security/rateLimiter';
import { getDeviceId } from '../lib/security/deviceUtils';
import ReCaptcha from 'react-native-recaptcha-that-works';

export function FeedbackForm() {
  const [feedback, setFeedback] = useState('');
  const [severity, setSeverity] = useState('low');
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  useEffect(() => {
    // Require CAPTCHA for high severity reports or after 2 submissions
    const checkCaptchaRequirement = async () => {
      const deviceId = await getDeviceId();
      const remaining = await incidentReportLimiter.getRemainingAttempts(deviceId);
      
      // Require CAPTCHA if only 1 attempt remaining or high severity
      setRequiresCaptcha(remaining <= 1 || severity === 'high');
    };

    checkCaptchaRequirement();
  }, [severity]);

  const handleSubmit = async () => {
    const deviceId = await getDeviceId();
    
    // Check rate limits
    const canSubmit = await incidentReportLimiter.canPerformAction(deviceId);
    if (!canSubmit) {
      Alert.alert('Submission Limit', 'You have reached the hourly feedback limit');
      return;
    }

    // Check CAPTCHA requirement
    if (requiresCaptcha && !captchaVerified) {
      setShowCaptcha(true);
      return;
    }

    try {
      await submitFeedback({
        content: feedback,
        severity,
        deviceId,
        captchaVerified: requiresCaptcha ? captchaVerified : null,
      });

      await incidentReportLimiter.recordAction(deviceId);
      
      Alert.alert('Thank You', 'Your feedback has been submitted');
      setFeedback('');
      setCaptchaVerified(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Your feedback..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
      />
      
      <Picker
        selectedValue={severity}
        onValueChange={setSeverity}
      >
        <Picker.Item label="Low Priority" value="low" />
        <Picker.Item label="Medium Priority" value="medium" />
        <Picker.Item label="High Priority" value="high" />
      </Picker>

      {requiresCaptcha && (
        <Text style={{ color: 'orange' }}>
          Human verification required for this submission
        </Text>
      )}
      
      <TouchableOpacity onPress={handleSubmit}>
        <Text>
          {requiresCaptcha && !captchaVerified 
            ? 'Verify & Submit Feedback' 
            : 'Submit Feedback'
          }
        </Text>
      </TouchableOpacity>

      <ReCaptcha
        siteKey={process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6Ld-ALYrAAAAAKW7vP_I_d2wKZ7_lz-g49AWhOl7'}
        baseUrl={process.env.EXPO_PUBLIC_APP_URL}
        onVerify={(token) => {
          if (token) {
            setCaptchaVerified(true);
            setShowCaptcha(false);
          }
        }}
        show={showCaptcha}
        onExpire={() => setCaptchaVerified(false)}
      />
    </View>
  );
}
```

## Example 5: Contextual Rate Limit Messages

```typescript
import React from 'react';
import { View, Text } from 'react-native';

interface RateLimitStatusProps {
  remainingAttempts: number;
  maxAttempts: number;
  actionName: string;
  resetTime: Date;
}

export function RateLimitStatus({ 
  remainingAttempts, 
  maxAttempts, 
  actionName,
  resetTime 
}: RateLimitStatusProps) {
  const percentage = (remainingAttempts / maxAttempts) * 100;
  
  let statusColor = '#4caf50'; // green
  let statusText = `${remainingAttempts} ${actionName}s remaining`;
  
  if (percentage <= 20) {
    statusColor = '#f44336'; // red
    statusText = `Warning: Only ${remainingAttempts} ${actionName}s left`;
  } else if (percentage <= 50) {
    statusColor = '#ff9800'; // orange
    statusText = `${remainingAttempts} ${actionName}s remaining`;
  }
  
  if (remainingAttempts === 0) {
    statusColor = '#f44336';
    statusText = `Limit reached. Reset at ${resetTime.toLocaleTimeString()}`;
  }

  return (
    <View style={{
      backgroundColor: statusColor + '20',
      padding: 8,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: statusColor,
      marginBottom: 10,
    }}>
      <Text style={{ color: statusColor, fontSize: 12 }}>
        {statusText}
      </Text>
    </View>
  );
}

// Usage in forms
export function FormWithRateLimitStatus() {
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [resetTime, setResetTime] = useState(new Date());

  return (
    <View>
      <RateLimitStatus
        remainingAttempts={remainingAttempts}
        maxAttempts={3}
        actionName="submission"
        resetTime={resetTime}
      />
      
      {/* Your form content */}
    </View>
  );
}
```

## Integration Checklist

### For Each Protected Action:

1. **Rate Limiting Setup**
   - [ ] Choose appropriate rate limits
   - [ ] Get device ID
   - [ ] Check rate limit before action
   - [ ] Record action after success
   - [ ] Handle rate limit exceeded

2. **CAPTCHA Integration**
   - [ ] Determine when CAPTCHA is required
   - [ ] Add CAPTCHA component
   - [ ] Handle verification success/failure
   - [ ] Reset verification for new actions

3. **User Experience**
   - [ ] Show remaining attempts
   - [ ] Provide clear error messages
   - [ ] Display reset times
   - [ ] Graceful degradation for failures

4. **Testing**
   - [ ] Test rate limit enforcement
   - [ ] Test CAPTCHA verification
   - [ ] Test error scenarios
   - [ ] Test across different devices

## Best Practices

1. **Progressive Security**: Start with lenient limits and tighten based on abuse
2. **Clear Communication**: Always inform users about rate limits
3. **Graceful Degradation**: Provide alternatives when limits are reached
4. **Consistent UX**: Use similar patterns across all protected actions
5. **Monitor Usage**: Track rate limit hits and adjust accordingly
