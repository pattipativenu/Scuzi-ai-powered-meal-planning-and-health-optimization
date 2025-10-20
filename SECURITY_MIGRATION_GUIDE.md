# Security Migration Guide

## 🚨 Immediate Actions Required

Your AWS credentials were exposed in your GitHub repository. Follow these steps immediately:

### 1. Rotate All Exposed Credentials

**AWS Credentials (CRITICAL - Do First):**
- Log into AWS Console
- Go to IAM → Users → serverless-deployer
- Delete the exposed access key: `AKIAZJVXTIG2JSF4IUGF`
- Create a new access key pair
- Update the quarantine policy as instructed by AWS

**Other Credentials to Rotate:**
- RDS database passwords
- WHOOP OAuth credentials
- Turso database tokens
- Any other API keys

### 2. Set Up AWS Secrets Manager

#### Step 1: Create New AWS Credentials
1. Create new AWS access keys with minimal required permissions
2. Ensure the new user has `SecretsManagerFullAccess` policy

#### Step 2: Configure Secrets Manager
1. Edit `scripts/migrate-secrets.js`
2. Replace all placeholder values with your NEW credentials
3. Run the migration script:

```bash
node scripts/migrate-secrets.js
```

#### Step 3: Update Environment Variables
1. Copy the ARN from the migration script output
2. Update `.env` and `.env.local` with the ARN:

```bash
APP_SECRETS_ARN=arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:scuzi-app-secrets-XXXXXX
```

#### Step 4: Test the Integration
```bash
node scripts/test-secrets.js
```

### 3. Security Best Practices Implemented

✅ **Environment files excluded from git**
✅ **Secrets moved to AWS Secrets Manager**
✅ **Only ARNs stored in environment (safe to expose)**
✅ **Caching implemented to reduce API calls**
✅ **Fallback to environment variables for development**

### 4. What Changed in Your Code

#### Before (Insecure):
```typescript
const clientId = process.env.WHOOP_CLIENT_ID;
const clientSecret = process.env.WHOOP_CLIENT_SECRET;
```

#### After (Secure):
```typescript
const { getAppSecrets } = await import('@/lib/secrets-manager');
const secrets = await getAppSecrets();
const clientId = secrets.whoop.clientId;
const clientSecret = secrets.whoop.clientSecret;
```

### 5. Files Updated

- `src/lib/secrets-manager.ts` - Enhanced with app secrets management
- `src/lib/aws-config.ts` - Updated to use secrets manager
- `src/lib/dynamodb-config.ts` - Updated to use secrets manager
- `src/app/api/whoop/*/route.ts` - Updated WHOOP API routes
- `.gitignore` - Added environment file exclusions
- `.env` and `.env.local` - Now contain only safe configuration

### 6. Production Deployment

For production deployment:

1. **Use IAM Roles** instead of access keys when possible
2. **Set the secrets ARN** in your production environment variables
3. **Ensure your production environment** has access to Secrets Manager
4. **Monitor access** to your secrets in CloudTrail

### 7. IAM Permissions Required

Your AWS user/role needs these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:CreateSecret",
                "secretsmanager:UpdateSecret",
                "secretsmanager:PutSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:scuzi-app-secrets-*"
        }
    ]
}
```

### 8. Monitoring and Alerts

Consider setting up:
- CloudTrail logging for Secrets Manager access
- CloudWatch alarms for unusual secret access patterns
- AWS Config rules for secret rotation compliance

## 🎯 Next Steps

1. **Complete the AWS security steps** from their email
2. **Run the migration script** with your new credentials
3. **Test your application** thoroughly
4. **Deploy to production** with the new secure setup
5. **Monitor** for any issues

## 🆘 Troubleshooting

**If secrets manager fails:**
- The code falls back to environment variables
- Check AWS credentials and permissions
- Verify the secret exists in the correct region
- Check CloudTrail logs for access denied errors

**Common Issues:**
- Wrong region in secrets manager
- Missing IAM permissions
- Incorrect secret ARN format
- Network connectivity issues

Your application will continue to work during the migration thanks to the fallback mechanism implemented.