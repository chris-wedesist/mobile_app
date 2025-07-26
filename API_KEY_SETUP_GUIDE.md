# API Key Setup Guide
## DESIST Mobile App - Legal Services Integration

### 🔑 Overview

This guide provides step-by-step instructions for obtaining API keys from legal service providers to enable real attorney data integration in the DESIST mobile app.

### 📋 Required API Keys

#### 1. Martindale-Hubbell Legal Directory
**Status**: Required for premium legal directory access
**Cost**: Free for basic usage
**Rate Limit**: 100 requests per hour

#### 2. Avvo Legal Directory
**Status**: Required for comprehensive attorney reviews
**Cost**: Free tier available
**Rate Limit**: 50 requests per hour

### 🚀 Step-by-Step Setup Instructions

## Martindale-Hubbell API Setup

### Step 1: Visit Developer Portal
1. Open your web browser
2. Navigate to: https://developer.martindale.com
3. Click "Sign Up" or "Get Started"

### Step 2: Create Developer Account
1. Fill out the registration form with:
   - **Business Email**: Use your company email address
   - **Company Name**: Your organization's legal name
   - **Contact Information**: Phone and address
   - **Intended Use**: Describe how you'll use the API
2. Accept the terms of service
3. Submit the application

### Step 3: Wait for Approval
- **Processing Time**: 2-3 business days
- **Notification**: You'll receive an email when approved
- **Follow-up**: Contact support if not approved within 5 days

### Step 4: Generate API Key
1. Log in to your developer dashboard
2. Navigate to "API Keys" section
3. Click "Generate New Key"
4. Copy the API key (format: `mh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 5: Add to Environment
1. Open your `.env` file
2. Add the line: `MARTINDALE_API_KEY=your_actual_key_here`
3. Save the file

## Avvo API Setup

### Step 1: Visit Developer Portal
1. Open your web browser
2. Navigate to: https://developer.avvo.com
3. Click "Get Started" or "Register"

### Step 2: Complete Registration
1. Fill out the application form:
   - **Professional Information**: Legal affiliation details
   - **Business Contact**: Valid business contact information
   - **Use Case**: Detailed description of your application
   - **Terms Agreement**: Accept terms of service
2. Submit for review

### Step 3: Wait for Review
- **Processing Time**: 1-2 business days
- **Notification**: Email confirmation when approved
- **Follow-up**: Contact support if needed

### Step 4: Access Credentials
1. Log in to your developer portal
2. Go to "Credentials" section
3. Generate your API key
4. Copy the API key (format: `av_xxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 5: Add to Environment
1. Open your `.env` file
2. Add the line: `AVVO_API_KEY=your_actual_key_here`
3. Save the file

### 🔧 Configuration

#### Environment File Setup
Create or update your `.env` file in the project root:

```env
# Legal Directory APIs
MARTINDALE_API_KEY=mh_your_actual_martindale_key_here
AVVO_API_KEY=av_your_actual_avvo_key_here

# Production Settings
NODE_ENV=production
LOG_LEVEL=info
ENABLE_API_MONITORING=true

# Rate Limiting
DEFAULT_RATE_LIMIT=100
MAX_RETRIES=3
REQUEST_TIMEOUT=10000

# Caching
CACHE_DURATION=1800000
MAX_CACHE_SIZE=1000

# Data Validation
REQUIRE_VERIFICATION=true
MIN_ATTORNEY_RATING=3.0
MAX_DISTANCE_RADIUS=100
```

#### API Key Validation
The system validates API keys using these formats:
- **Martindale-Hubbell**: Starts with `mh_` and at least 32 characters
- **Avvo**: Starts with `av_` and at least 24 characters

### 🧪 Testing Your Setup

#### Automated Testing
Run the API key setup script:
```bash
node scripts/api-key-setup.js
```

#### Manual Testing
1. Start the Expo development server
2. Navigate to the Legal Help tab
3. Search for attorneys in your area
4. Verify that real attorney data is returned

### 📊 Monitoring

#### API Health Monitoring
The app includes built-in monitoring for:
- API response times
- Success/failure rates
- Rate limit usage
- Error tracking

#### Health Check Commands
```bash
# Check API status
node scripts/monitor-production.js

# View health reports
ls monitoring/
```

### 🚨 Troubleshooting

#### Common Issues

**Issue**: API key not recognized
**Solution**: 
- Verify the key format is correct
- Check that the key is properly added to `.env`
- Restart the development server

**Issue**: Rate limit exceeded
**Solution**:
- Check your current usage
- Implement caching to reduce API calls
- Contact the API provider for higher limits

**Issue**: No attorney results
**Solution**:
- Verify your location permissions
- Check API health status
- Review search parameters

#### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Invalid API key` | Key format is incorrect | Check key format and re-enter |
| `Rate limit exceeded` | Too many requests | Wait or implement caching |
| `API unavailable` | Service is down | Check API provider status |
| `No results found` | No attorneys in area | Try larger search radius |

### 📞 Support

#### API Provider Support
- **Martindale-Hubbell**: api@martindale.com
- **Avvo**: api@avvo.com

#### Development Support
- **Technical Issues**: Check the troubleshooting section
- **Configuration Help**: Review this guide
- **Emergency Contact**: [Your support contact]

### 🔒 Security Best Practices

#### API Key Security
1. **Never commit API keys to version control**
2. **Use environment variables**
3. **Rotate keys regularly**
4. **Monitor usage for anomalies**

#### Data Protection
1. **Encrypt sensitive data**
2. **Implement proper access controls**
3. **Monitor for data breaches**
4. **Comply with privacy regulations**

### 📈 Usage Optimization

#### Rate Limiting
- **Martindale-Hubbell**: 100 requests/hour
- **Avvo**: 50 requests/hour
- **Monitor usage**: Track API calls
- **Implement caching**: Reduce redundant requests

#### Performance Tips
1. **Cache responses** for 30 minutes
2. **Batch requests** when possible
3. **Use appropriate timeouts**
4. **Monitor response times**

### ✅ Verification Checklist

Before going live, verify:

- [ ] API keys are properly configured
- [ ] Environment variables are set
- [ ] API connectivity is tested
- [ ] Rate limits are understood
- [ ] Error handling is implemented
- [ ] Monitoring is active
- [ ] Security measures are in place
- [ ] Documentation is complete

### 🎯 Next Steps

After completing API key setup:

1. **Test the integration** thoroughly
2. **Monitor performance** and usage
3. **Implement caching** strategies
4. **Set up alerts** for issues
5. **Document any customizations**
6. **Prepare for production deployment**

### 📚 Additional Resources

- **API Documentation**: See individual provider docs
- **Code Examples**: Check the codebase
- **Community Support**: Developer forums
- **Legal Compliance**: Privacy and data protection guidelines

---

**Note**: This guide is for the DESIST mobile app. Always refer to the latest API provider documentation for the most current information. 