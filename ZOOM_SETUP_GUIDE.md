# Zoom API Setup Guide for Server-to-Server OAuth

## Overview
This guide will help you set up Zoom API credentials using Server-to-Server OAuth authentication (the modern, secure way recommended by Zoom).

## Step 1: Create a Server-to-Server OAuth App in Zoom Marketplace

1. **Go to Zoom Marketplace**
   - Visit: https://marketplace.zoom.us/
   - Sign in with your Zoom account

2. **Create a New App**
   - Click "Develop" in the top menu
   - Click "Build App"
   - Choose "Server-to-Server OAuth" (NOT JWT - JWT is deprecated!)
   - Click "Create"

3. **Fill App Information**
   - **App Name**: Your app name (e.g., "Pharma Connect Backend")
   - **Company Name**: Your organization
   - **Developer Email**: Your email
   - **Short Description**: Brief description of your app
   - Click "Continue"

4. **Copy Your Credentials**
   From the "App Credentials" section, copy these three values:
   - **Account ID** (NOT the same as API Key!)
   - **Client ID** 
   - **Client Secret**

## Step 2: Set Scopes (Permissions)

In the "Scopes" section, add these required permissions:
- `meeting:write` - Create meetings
- `meeting:read` - Read meeting details
- `meeting:update` - Update meetings
- `meeting:delete` - Delete meetings
- `user:read` - Read user information

Click "Continue" after adding scopes.

## Step 3: Activate Your App

1. Go to the "Activation" section
2. Click "Activate your app"
3. Your app is now ready to use!

## Step 4: Update Your Environment Variables

Replace your current Zoom environment variables with these:

```env
# Zoom Server-to-Server OAuth Configuration
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here  
ZOOM_CLIENT_SECRET=your_client_secret_here

# Remove these old JWT variables (no longer needed):
# ZOOM_API_KEY=...
# ZOOM_API_SECRET=...
```

## Important Notes

### Finding Your Account ID
- **Account ID is NOT the same as your API Key!**
- You can find your Account ID in:
  1. Zoom Marketplace → Your App → App Credentials section
  2. Zoom Admin Dashboard → Account Management → Account Info
  3. It usually looks like: `q8HqkL-5QFCcqslfbjrvAA` (shorter than API keys)

### Security Best Practices
1. **Never commit credentials to version control**
2. **Use different apps for development and production**
3. **Regularly rotate your Client Secret**
4. **Monitor API usage in Zoom dashboard**

## Step 5: Test Your Integration

After updating your environment variables, test the integration:

```bash
# Restart your NestJS application
npm run start:dev

# Test the standalone meeting endpoint
curl -X POST http://localhost:3000/meetings/standalone \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test Meeting",
    "duration": 60,
    "agenda": "Testing Zoom integration"
  }'
```

## Troubleshooting

### Common Issues

1. **"Invalid access token" (Code 124)**
   - Check that your Account ID, Client ID, and Client Secret are correct
   - Ensure your app is activated in Zoom Marketplace
   - Verify you're not using old JWT credentials

2. **"App deactivated" (Code 3000)**
   - Your app needs to be activated in Zoom Marketplace
   - Go to your app → Activation section → Activate

3. **"Insufficient privileges" (Code 200)**
   - Add the required scopes to your app
   - Make sure your Zoom account has meeting creation permissions

4. **Environment Variable Issues**
   - Double-check variable names (ZOOM_ACCOUNT_ID, not ZOOM_API_KEY)
   - Ensure no extra spaces or quotes in your .env file
   - Restart your application after changing .env

### Getting Help

- **Zoom API Documentation**: https://developers.zoom.us/docs/api/
- **Server-to-Server OAuth Guide**: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
- **API Reference**: https://developers.zoom.us/docs/api/meetings/

## Migration from JWT (Legacy)

If you were previously using JWT authentication:

1. **Create a new Server-to-Server OAuth app** (don't modify your existing JWT app)
2. **Update environment variables** as shown above
3. **Remove JWT dependencies** from your package.json if no longer needed:
   ```bash
   npm uninstall jsonwebtoken
   npm uninstall @types/jsonwebtoken  # if using TypeScript
   ```
4. **Test thoroughly** in development before deploying to production

## Environment Variables Template

Create or update your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_database_name

# Zoom Server-to-Server OAuth
ZOOM_ACCOUNT_ID=your_account_id_here
ZOOM_CLIENT_ID=your_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here

# JWT Configuration (for your app's auth, not Zoom)
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Other configurations...
```

Remember to replace the placeholder values with your actual credentials!
