# WHOOP Daily Sync Lambda Function

## Overview
This Lambda function runs daily to sync WHOOP health data for all connected users.

## Features
- ✅ Automatic token refresh using AWS Secrets Manager
- ✅ Syncs data for all WHOOP-connected users
- ✅ Rate limiting to avoid API throttling
- ✅ Comprehensive CloudWatch logging
- ✅ Error handling and retry logic
- ✅ EventBridge cron trigger (daily at 6 AM UTC)

## Deployment

### 1. Install Dependencies
```bash
cd src/app/api/whoop/lambda-sync
npm install
```

### 2. Build Lambda Package
```bash
npm run build
npm run package
```

This creates `whoop-sync-lambda.zip` ready for deployment.

### 3. Create Lambda Function (First Time)
```bash
aws lambda create-function \
  --function-name whoop-daily-sync \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://whoop-sync-lambda.zip \
  --timeout 300 \
  --memory-size 512 \
  --environment Variables="{API_BASE_URL=https://scuzi.vercel.app,WHOOP_SECRETS_ID=whoop/credentials,AWS_REGION=us-east-1}" \
  --region us-east-1
```

### 4. Update Existing Lambda
```bash
npm run deploy
```

Or manually:
```bash
aws lambda update-function-code \
  --function-name whoop-daily-sync \
  --zip-file fileb://whoop-sync-lambda.zip \
  --region us-east-1
```

### 5. Create EventBridge Rule (Cron Trigger)
```bash
aws events put-rule \
  --name whoop-daily-sync-trigger \
  --schedule-expression "cron(0 6 * * ? *)" \
  --state ENABLED \
  --description "Triggers WHOOP data sync daily at 6 AM UTC" \
  --region us-east-1
```

### 6. Add Lambda Permission for EventBridge
```bash
aws lambda add-permission \
  --function-name whoop-daily-sync \
  --statement-id whoop-daily-sync-event \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/whoop-daily-sync-trigger \
  --region us-east-1
```

### 7. Connect EventBridge Rule to Lambda
```bash
aws events put-targets \
  --rule whoop-daily-sync-trigger \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:whoop-daily-sync" \
  --region us-east-1
```

## IAM Permissions Required

The Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:ListSecrets"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:whoop-tokens/*",
        "arn:aws:secretsmanager:us-east-1:*:secret:whoop/credentials-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:*"
    }
  ]
}
```

## Environment Variables

Set these in Lambda configuration:

- `API_BASE_URL`: Your API endpoint (e.g., `https://scuzi.vercel.app`)
- `WHOOP_SECRETS_ID`: Secrets Manager secret ID for WHOOP credentials (default: `whoop/credentials`)
- `AWS_REGION`: AWS region (default: `us-east-1`)

## Testing

### Test Lambda Locally
```bash
# Install AWS SAM CLI
npm install -g aws-sam-cli

# Run locally
sam local invoke whoop-daily-sync -e test-event.json
```

### Test in AWS Console
1. Go to Lambda Console
2. Open `whoop-daily-sync` function
3. Click "Test" tab
4. Create test event with empty JSON: `{}`
5. Click "Test"

### View Logs
```bash
aws logs tail /aws/lambda/whoop-daily-sync --follow
```

## Cron Schedule

Current: `cron(0 6 * * ? *)` = Daily at 6:00 AM UTC

Common alternatives:
- `cron(0 */6 * * ? *)` = Every 6 hours
- `cron(0 0 * * ? *)` = Daily at midnight UTC
- `cron(0 12 * * ? *)` = Daily at noon UTC

## Monitoring

### CloudWatch Metrics
- **Invocations**: Number of times Lambda ran
- **Duration**: Execution time per run
- **Errors**: Failed executions
- **Throttles**: Rate-limited requests

### CloudWatch Alarms
Set up alarms for:
- Lambda errors > 0
- Duration > 4 minutes (approaching timeout)
- Failed user syncs > 10%

### Example Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name whoop-sync-errors \
  --alarm-description "Alert when WHOOP sync fails" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=whoop-daily-sync
```

## Troubleshooting

### "No users to sync"
- No users have connected WHOOP yet
- Check Secrets Manager for `whoop-tokens/*` secrets

### Token refresh fails
- Verify WHOOP credentials in Secrets Manager (`whoop/credentials`)
- Check WHOOP API status
- Review CloudWatch logs for detailed error messages

### Sync API returns 500
- Check if RDS database is accessible
- Verify RDS credentials are correct
- Check API endpoint health

### Lambda timeout
- Increase timeout (current: 300 seconds)
- Reduce batch size
- Add pagination for large user lists

## Success Criteria

✅ Lambda runs daily at 6 AM UTC
✅ All connected users' data syncs successfully  
✅ Tokens refresh automatically when expired
✅ CloudWatch logs show detailed execution info
✅ EventBridge trigger fires reliably
✅ No manual intervention needed

## Cost Optimization

- **Lambda**: Free tier covers ~1M requests/month
- **Secrets Manager**: $0.40/secret/month + $0.05/10K API calls
- **CloudWatch Logs**: Free tier covers 5GB/month
- **EventBridge**: Free for cron triggers

Estimated monthly cost: **~$5-10** for 100 users