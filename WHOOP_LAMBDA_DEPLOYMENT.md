# WHOOP OAuth Lambda Deployment Guide

## Overview
This guide covers deploying the WHOOP OAuth callback handler as an AWS Lambda function with API Gateway integration.

## Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- AWS Lambda function already created at API Gateway endpoint: `https://zh2o5rcze6.execute-api.us-east-1.amazonaws.com/dev/api/whoop/callback`

## Step 1: Update AWS Secrets Manager

**CRITICAL**: Update your AWS Secrets Manager secret with all required credentials including the new `frontend_url` field:

```bash
aws secretsmanager put-secret-value \
  --secret-id whoop/shoyu-7tmUGN \
  --region us-east-1 \
  --secret-string '{
    "client_id": "299bf73c-9f7a-4720-a283-cb5fdfcef648",
    "client_secret": "7efe5938872060d4f422a8f7079cbd75bfb0d5b9bc2dc3750e33f913924ae0cf",
    "redirect_uri": "https://zh2o5rcze6.execute-api.us-east-1.amazonaws.com/dev/api/whoop/callback",
    "frontend_url": "http://localhost:3000",
    "oauth_state_secret": "whoop-oauth-state-secret-key-2024"
  }'
```

**For Production**: Replace `frontend_url` with your production domain:
```json
"frontend_url": "https://yourdomain.com"
```

## Step 2: Build Lambda Package

Navigate to the Lambda source directory:

```bash
cd src/app/api/whoop/lambda
```

Install dependencies:

```bash
npm install
```

Build TypeScript:

```bash
npm run build
```

Create deployment package:

```bash
npm run package
```

This creates `whoop-lambda.zip` containing the compiled Lambda function.

## Step 3: Deploy Lambda Function

### Option A: AWS Console

1. Go to AWS Lambda Console
2. Find your function (should be connected to API Gateway endpoint)
3. Click "Upload from" → ".zip file"
4. Upload `whoop-lambda.zip`
5. Click "Save"

### Option B: AWS CLI

```bash
aws lambda update-function-code \
  --function-name YOUR_LAMBDA_FUNCTION_NAME \
  --zip-file fileb://whoop-lambda.zip \
  --region us-east-1
```

## Step 4: Configure Lambda Environment Variables

Set the Secrets Manager secret ID (if different from default):

```bash
aws lambda update-function-configuration \
  --function-name YOUR_LAMBDA_FUNCTION_NAME \
  --environment Variables={AWS_SECRETS_MANAGER_SECRET_ID=whoop/shoyu-7tmUGN} \
  --region us-east-1
```

## Step 5: Update Lambda Handler Configuration

Ensure Lambda handler is set to: `index.handler`

**Runtime**: Node.js 18.x or later
**Timeout**: 30 seconds (recommended)
**Memory**: 256 MB (minimum)

## Step 6: Configure IAM Permissions

Your Lambda execution role needs permission to read from Secrets Manager:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:whoop/shoyu-7tmUGN-*"
    }
  ]
}
```

## Step 7: Configure API Gateway CORS

**CRITICAL**: Enable CORS on your API Gateway endpoint:

1. Go to API Gateway Console
2. Find your API
3. Select the `/api/whoop/callback` resource
4. Enable CORS with these settings:
   - **Access-Control-Allow-Origin**: `*` (or your specific domain)
   - **Access-Control-Allow-Methods**: `GET, OPTIONS`
   - **Access-Control-Allow-Headers**: `Content-Type, Authorization`
   - **Access-Control-Allow-Credentials**: `true`

## Step 8: Update WHOOP Developer Portal

**CRITICAL**: Add the Lambda callback URL to your WHOOP app:

1. Go to [WHOOP Developer Portal](https://developer.whoop.com/)
2. Open your app settings
3. Add redirect URI: `https://zh2o5rcze6.execute-api.us-east-1.amazonaws.com/dev/api/whoop/callback`
4. Save changes

## Step 9: Test the OAuth Flow

1. Start your Next.js app: `npm run dev`
2. Click "Connect WHOOP" button
3. WHOOP auth should open in a **new tab/window**
4. After granting access, you should see a success page
5. Close the success tab manually
6. Main app should show "WHOOP connected successfully!" message

## OAuth Flow Architecture

```
┌─────────────────┐
│   Main App      │  1. User clicks "Connect WHOOP"
│  (localhost)    │  2. Opens new window with authUrl
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  New Tab/Window │  3. User logs in to WHOOP
│   WHOOP OAuth   │  4. WHOOP redirects to Lambda callback
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS Lambda     │  5. Validates state JWT
│    Callback     │  6. Exchanges code for token
└────────┬────────┘  7. Redirects to success/error page
         │
         ▼
┌─────────────────┐
│ Success/Error   │  8. Stores tokens in cookies
│     Page        │  9. Sends postMessage to parent window
└────────┬────────┘  10. User manually closes this tab
         │
         ▼
┌─────────────────┐
│   Main App      │  11. Receives postMessage
│  (localhost)    │  12. Fetches WHOOP metrics
└─────────────────┘  13. Shows success message
```

## Security Features

✅ **JWT State Validation**: Prevents CSRF attacks with cryptographically signed state tokens
✅ **10-Minute Expiration**: State tokens auto-expire after 10 minutes
✅ **No Cookie Dependencies**: Self-contained JWT works across domains
✅ **Secrets Manager**: Client secret never exposed to frontend
✅ **URL Fragment**: Tokens passed via hash (not logged by servers)
✅ **HTTPOnly Cookies**: XSS protection for stored tokens
✅ **New Window OAuth**: Main app session remains intact
✅ **postMessage Communication**: Secure cross-window communication

## Troubleshooting

### Error: "invalid_state"

**Cause**: State parameter missing or too weak

**Solution**: 
- Verify `OAUTH_STATE_SECRET` is set in AWS Secrets Manager
- Check Lambda logs for state validation errors
- Ensure state JWT is generated correctly in `/api/whoop/connect`

### Error: "token_exchange_failed"

**Cause**: WHOOP rejected the token exchange request

**Solution**:
- Verify `client_id` and `client_secret` in Secrets Manager
- Check `redirect_uri` matches exactly with WHOOP Developer Portal
- Review Lambda CloudWatch logs for detailed error messages

### Popup Blocked

**Cause**: Browser blocked the OAuth window

**Solution**:
- Allow popups for localhost (or your domain)
- Main app will show warning message
- Click "Connect" again after allowing popups

### Main App Shows Blank Screen

**Cause**: OAuth redirected in same tab (old behavior)

**Solution**:
- Verify you're using the updated `ScuziChat.tsx` component
- Check that `window.open(..., "_blank", ...)` is being called
- Clear browser cache and reload

### postMessage Not Received

**Cause**: Origin mismatch or popup closed before sending message

**Solution**:
- Check browser console for origin warnings
- Verify success/error pages are sending postMessage
- Ensure main app has message listener active

### CORS Errors

**Cause**: API Gateway CORS not configured

**Solution**:
- Enable CORS on API Gateway endpoint
- Add required headers (see Step 7)
- Redeploy API Gateway stage

## CloudWatch Logs

Monitor Lambda execution:

```bash
aws logs tail /aws/lambda/YOUR_LAMBDA_FUNCTION_NAME --follow
```

Look for these log messages:
- `🔍 WHOOP OAuth Callback Lambda invoked`
- `🔐 Verifying state JWT token...`
- `✅ State JWT verified`
- `🔄 Exchanging authorization code...`
- `✅ Token exchange successful`

## Production Deployment

For production, update these values:

1. **Secrets Manager**:
   ```json
   "frontend_url": "https://yourdomain.com"
   ```

2. **WHOOP Developer Portal**:
   - Add production redirect URI
   - Keep test/staging URLs for development

3. **CORS Configuration**:
   - Replace `*` with specific domain: `https://yourdomain.com`

4. **Environment Variables**:
   - Use production API Gateway endpoint

## Success Criteria

✅ Clicking "Connect WHOOP" opens OAuth in new tab/window
✅ Main app remains fully functional during OAuth process
✅ Success page displays "Access Granted!" message
✅ User can close success tab manually
✅ Main app receives postMessage and shows success message
✅ WHOOP metrics (sleep, strain, calories) display correctly
✅ No blank screens or broken sessions
✅ Works on both desktop and mobile browsers

## Next Steps After Deployment

1. Test OAuth flow end-to-end
2. Verify WHOOP metrics sync correctly
3. Test error scenarios (denied access, expired state, etc.)
4. Monitor CloudWatch logs for any issues
5. Set up CloudWatch alarms for Lambda errors
6. Document any environment-specific configuration

---

**Questions or Issues?**

Check CloudWatch Logs first for detailed error messages. Most issues are related to:
- Incorrect Secrets Manager values
- Missing CORS configuration
- WHOOP Developer Portal redirect URI mismatch