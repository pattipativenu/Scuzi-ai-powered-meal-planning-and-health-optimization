# WHOOP CloudWatch Monitoring & Logging Guide

## Overview
Complete CloudWatch monitoring setup for WHOOP integration including logs, metrics, alarms, and dashboards.

## Architecture

```
┌─────────────────┐
│   OAuth Flow    │ → CloudWatch Logs: /aws/lambda/whoop-callback
└─────────────────┘

┌─────────────────┐
│  Data Sync API  │ → CloudWatch Logs: /vercel/api/whoop/sync-data
└─────────────────┘

┌─────────────────┐
│ Lambda Sync     │ → CloudWatch Logs: /aws/lambda/whoop-daily-sync
│ (Daily Cron)    │ → Custom Metrics: WHOOP/Sync
└─────────────────┘

┌─────────────────┐
│ Secrets Manager │ → CloudWatch Events: Token operations
└─────────────────┘
```

---

## 1. CloudWatch Logs

### Log Groups

**Lambda Daily Sync:**
```bash
/aws/lambda/whoop-daily-sync
```

**OAuth Callback (if deployed as Lambda):**
```bash
/aws/lambda/whoop-callback
```

**Vercel API Routes (if integrated):**
```bash
/vercel/api/whoop/*
```

### Log Format

All WHOOP operations use structured logging with emojis for easy scanning:

| Emoji | Meaning |
|-------|---------|
| 🚀 | Process started |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| 🔄 | In progress |
| 📊 | Data/Stats |
| 🔍 | Debug info |
| 📅 | Timestamp/Date |
| 📋 | List/Summary |
| 🔐 | Security/Auth |

### Log Retention

Set appropriate retention periods:

```bash
# Daily sync logs - keep for 30 days
aws logs put-retention-policy \
  --log-group-name /aws/lambda/whoop-daily-sync \
  --retention-in-days 30

# OAuth callback logs - keep for 14 days
aws logs put-retention-policy \
  --log-group-name /aws/lambda/whoop-callback \
  --retention-in-days 14
```

---

## 2. CloudWatch Metrics

### Built-in Lambda Metrics

Available automatically for all Lambda functions:

- **Invocations**: Number of times function was invoked
- **Duration**: Execution time per invocation
- **Errors**: Number of failed invocations
- **Throttles**: Number of throttled requests
- **ConcurrentExecutions**: Number of concurrent executions
- **IteratorAge**: For event source mappings
- **DeadLetterErrors**: Async invocation failures

### Custom Metrics

Create custom metrics in Lambda code for deeper insights:

```typescript
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatchClient({ region: "us-east-1" });

// Track sync success rate
await cloudwatch.send(new PutMetricDataCommand({
  Namespace: "WHOOP/Sync",
  MetricData: [
    {
      MetricName: "UsersSynced",
      Value: successCount,
      Unit: "Count",
      Timestamp: new Date(),
    },
    {
      MetricName: "SyncFailures",
      Value: failureCount,
      Unit: "Count",
      Timestamp: new Date(),
    },
    {
      MetricName: "RecordsInserted",
      Value: totalRecordsInserted,
      Unit: "Count",
      Timestamp: new Date(),
    },
  ],
}));
```

---

## 3. CloudWatch Alarms

### Critical Alarms

#### Lambda Errors
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name whoop-sync-errors \
  --alarm-description "Alert when WHOOP sync Lambda fails" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=whoop-daily-sync \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-alerts
```

#### Lambda Duration (Timeout Warning)
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name whoop-sync-duration \
  --alarm-description "Alert when WHOOP sync approaches timeout" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Maximum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 240000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=whoop-daily-sync \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-alerts
```

#### Token Refresh Failures
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name whoop-token-refresh-failures \
  --alarm-description "Alert when WHOOP token refresh fails" \
  --metric-name TokenRefreshErrors \
  --namespace WHOOP/Auth \
  --statistic Sum \
  --period 3600 \
  --evaluation-periods 1 \
  --threshold 3 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-alerts
```

#### Sync Success Rate
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name whoop-sync-success-rate \
  --alarm-description "Alert when WHOOP sync success rate drops below 90%" \
  --metric-name SyncSuccessRate \
  --namespace WHOOP/Sync \
  --statistic Average \
  --period 3600 \
  --evaluation-periods 2 \
  --threshold 90 \
  --comparison-operator LessThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-alerts
```

### Warning Alarms

#### High Memory Usage
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name whoop-sync-memory \
  --alarm-description "Alert when memory usage exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=whoop-daily-sync \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-warnings
```

---

## 4. CloudWatch Dashboard

Create a comprehensive dashboard for WHOOP monitoring:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name WHOOP-Integration \
  --dashboard-body file://whoop-dashboard.json
```

**whoop-dashboard.json:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Daily Sync Runs"}],
          [".", "Errors", {"stat": "Sum", "label": "Errors"}],
          [".", "Duration", {"stat": "Average", "label": "Avg Duration (ms)"}]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Lambda Performance",
        "yAxis": {
          "left": {
            "label": "Count",
            "showUnits": false
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["WHOOP/Sync", "UsersSynced", {"stat": "Sum", "label": "Users Synced"}],
          [".", "SyncFailures", {"stat": "Sum", "label": "Failures"}],
          [".", "RecordsInserted", {"stat": "Sum", "label": "Records Inserted"}]
        ],
        "period": 3600,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Sync Statistics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/lambda/whoop-daily-sync'\n| fields @timestamp, @message\n| filter @message like /❌/\n| sort @timestamp desc\n| limit 20",
        "region": "us-east-1",
        "title": "Recent Errors",
        "stacked": false
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/lambda/whoop-daily-sync'\n| fields @timestamp, @message\n| filter @message like /✅ WHOOP Daily Sync Completed/\n| parse @message '✅ WHOOP Daily Sync Completed' as completion\n| parse @message '📊 Stats: */*' as success, total\n| stats latest(success) as SuccessfulSyncs, latest(total) as TotalUsers by bin(5m)",
        "region": "us-east-1",
        "title": "Sync Success Rate (5min)",
        "stacked": false
      }
    }
  ]
}
```

---

## 5. Log Insights Queries

### Most Common Errors
```sql
fields @timestamp, @message
| filter @message like /❌/
| stats count() by @message
| sort count desc
| limit 10
```

### Sync Performance by User
```sql
fields @timestamp, @message
| filter @message like /Sync completed for user/
| parse @message 'user * :' as userId
| parse @message 'totalProcessed: *' as recordsProcessed
| stats sum(recordsProcessed) as TotalRecords by userId
| sort TotalRecords desc
```

### Token Refresh Frequency
```sql
fields @timestamp, @message
| filter @message like /Refreshing expired token/
| stats count() by bin(1h)
```

### Average Sync Duration
```sql
fields @timestamp, @message
| filter @message like /Duration:/
| parse @message 'Duration: *ms' as duration
| stats avg(duration) as AvgDuration, max(duration) as MaxDuration, min(duration) as MinDuration
```

### Failed User Syncs
```sql
fields @timestamp, @message
| filter @message like /Error syncing user/
| parse @message 'user * :' as userId
| stats count() as FailureCount by userId
| sort FailureCount desc
```

---

## 6. SNS Notifications

### Create SNS Topic
```bash
aws sns create-topic \
  --name whoop-alerts \
  --region us-east-1
```

### Subscribe Email
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Subscribe Slack (via webhook)
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:whoop-alerts \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:slack-notifier
```

---

## 7. Cost Optimization

### Log Filtering

Only log important events to reduce costs:

```typescript
const logLevel = process.env.LOG_LEVEL || "INFO"; // ERROR, WARN, INFO, DEBUG

function log(level: string, message: string) {
  const levels = ["ERROR", "WARN", "INFO", "DEBUG"];
  if (levels.indexOf(level) <= levels.indexOf(logLevel)) {
    console.log(`[${level}] ${message}`);
  }
}
```

### Metric Filtering

Use metric filters to extract custom metrics from logs without additional API calls:

```bash
aws logs put-metric-filter \
  --log-group-name /aws/lambda/whoop-daily-sync \
  --filter-name TokenRefreshCount \
  --filter-pattern "[time, request_id, level = ERROR, msg = \"Token refresh failed*\"]" \
  --metric-transformations \
    metricName=TokenRefreshErrors,\
    metricNamespace=WHOOP/Auth,\
    metricValue=1
```

---

## 8. Troubleshooting Playbook

### Issue: "No users to sync"

**Symptoms:**
- Lambda runs successfully but logs "No WHOOP-connected users found"

**Investigation:**
```sql
fields @timestamp, @message
| filter @message like /No WHOOP-connected users/
```

**Resolution:**
1. Verify users have connected WHOOP (check Secrets Manager)
2. Ensure secret naming follows pattern: `whoop-tokens/{userId}`

---

### Issue: "Token refresh failed"

**Symptoms:**
- Multiple users fail to sync
- Error message contains "Token refresh failed"

**Investigation:**
```sql
fields @timestamp, @message
| filter @message like /Token refresh failed/
| parse @message 'user * :' as userId
| stats count() by userId
```

**Resolution:**
1. Check WHOOP API status
2. Verify WHOOP client credentials in Secrets Manager
3. Ask affected users to reconnect WHOOP

---

### Issue: "RDS connection timeout"

**Symptoms:**
- Sync API returns 500 errors
- Logs show database connection failures

**Investigation:**
```sql
fields @timestamp, @message
| filter @message like /Error syncing/
| filter @message like /RDS/
```

**Resolution:**
1. Check RDS instance status
2. Verify security group allows Lambda access
3. Check RDS connection pool limits

---

### Issue: "Lambda timeout"

**Symptoms:**
- Lambda duration exceeds 240 seconds
- Incomplete syncs

**Investigation:**
```sql
fields @timestamp, @duration
| filter @message like /Duration:/
| parse @message 'Duration: *ms' as duration
| sort duration desc
| limit 20
```

**Resolution:**
1. Increase Lambda timeout (max 15 minutes)
2. Reduce batch size per execution
3. Implement pagination for large user lists

---

## 9. Best Practices

### ✅ DO

- **Enable detailed monitoring** for all Lambda functions
- **Set up alarms** before going to production
- **Use structured logging** with consistent format
- **Tag all resources** with `Project: WHOOP`, `Environment: Production`
- **Review logs weekly** to identify patterns
- **Archive old logs** to S3 for cost savings
- **Use CloudWatch Insights** for complex queries
- **Monitor cost** with CloudWatch billing alarms

### ❌ DON'T

- **Don't log sensitive data** (tokens, passwords, PII)
- **Don't use `console.log` without structure** 
- **Don't ignore warning alarms**
- **Don't set overly aggressive thresholds** (too many false positives)
- **Don't forget to clean up** old log groups
- **Don't skip testing** alarm notifications

---

## 10. Monitoring Checklist

### Daily
- [ ] Review error count in dashboard
- [ ] Check sync success rate
- [ ] Verify no critical alarms

### Weekly
- [ ] Analyze log insights for patterns
- [ ] Review Lambda duration trends
- [ ] Check token refresh frequency
- [ ] Verify RDS connection health

### Monthly
- [ ] Review CloudWatch costs
- [ ] Optimize log retention policies
- [ ] Update alarm thresholds based on patterns
- [ ] Clean up unused log groups
- [ ] Review and update dashboard widgets

---

## 11. Emergency Contacts

| Issue | Contact | SLA |
|-------|---------|-----|
| Lambda failures | DevOps team | 1 hour |
| WHOOP API issues | WHOOP support | 24 hours |
| RDS downtime | Database admin | 30 minutes |
| Security incidents | Security team | Immediate |

---

## Success Criteria

✅ All Lambda invocations logged to CloudWatch
✅ Critical alarms configured and tested
✅ Dashboard displays real-time metrics
✅ SNS notifications working for errors
✅ Log retention policies set appropriately
✅ CloudWatch Insights queries documented
✅ Cost monitoring enabled
✅ Team trained on troubleshooting playbook

---

## Additional Resources

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Lambda Monitoring Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-insights.html)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [WHOOP API Documentation](https://developer.whoop.com/)