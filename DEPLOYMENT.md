# Scuzi AI - Deployment Guide

## 🚀 Quick Deploy to Vercel (Recommended)

### Prerequisites
- AWS Account with Bedrock access
- Vercel account
- GitHub repository (already set up)

### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from your repository
vercel --prod
```

### 2. Configure Environment Variables in Vercel
Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# AWS Bedrock
AWS_BEDROCK_SECRET_ARN=your_bedrock_secret_arn

# Database Configuration
RDS_HOST=your_rds_host
RDS_PORT=3306
RDS_USER=your_rds_user
RDS_PASSWORD=your_rds_password
RDS_DATABASE=your_database_name

# AWS S3
S3_BUCKET_MEALS=your_s3_bucket
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# Authentication
BETTER_AUTH_SECRET=your_random_secret_key

# WHOOP Integration (Optional)
WHOOP_CLIENT_ID=your_whoop_client_id
WHOOP_CLIENT_SECRET=your_whoop_client_secret

# Public URLs
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
```

### 3. Redeploy
```bash
vercel --prod
```

## 🏗️ AWS Infrastructure Setup

### 1. AWS Bedrock Setup
```bash
# Enable Bedrock models in AWS Console
# Required models:
# - Claude 3.5 Sonnet v2
# - Titan Image Generator G1 v2
```

### 2. Create S3 Bucket
```bash
aws s3 mb s3://your-scuzi-meal-images --region us-east-1
```

### 3. Setup RDS MySQL Database
```bash
# Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier scuzi-meals-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password your-secure-password \
  --allocated-storage 20
```

### 4. Create DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name scuzi-chat-history \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=timestamp,AttributeType=N \
  --key-schema AttributeName=userId,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### 5. Setup Secrets Manager
```bash
# Store AWS credentials
aws secretsmanager create-secret \
  --name "scuzi-ai/aws-credentials" \
  --description "AWS credentials for Scuzi AI" \
  --secret-string '{"AWS_ACCESS_KEY_ID":"your-key","AWS_SECRET_ACCESS_KEY":"your-secret"}'

# Store WHOOP credentials
aws secretsmanager create-secret \
  --name "scuzi-ai/whoop-credentials" \
  --description "WHOOP API credentials" \
  --secret-string '{"WHOOP_CLIENT_ID":"your-id","WHOOP_CLIENT_SECRET":"your-secret"}'
```

## 🐳 Docker Deployment

### 1. Create Dockerfile
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

### 2. Build and Run
```bash
# Build image
docker build -t scuzi-ai .

# Run container
docker run -p 3000:3000 --env-file .env.local scuzi-ai
```

### 3. Deploy to AWS ECS (Optional)
```bash
# Push to ECR
aws ecr create-repository --repository-name scuzi-ai
docker tag scuzi-ai:latest your-account.dkr.ecr.us-east-1.amazonaws.com/scuzi-ai:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/scuzi-ai:latest

# Create ECS service
aws ecs create-service \
  --cluster default \
  --service-name scuzi-ai \
  --task-definition scuzi-ai:1 \
  --desired-count 1
```

## 🌐 Alternative Deployment Options

### Netlify
```bash
# Build command: npm run build
# Publish directory: .next
# Environment variables: Same as Vercel
```

### AWS Amplify
```bash
# Connect GitHub repository
# Build settings:
# - Build command: npm run build
# - Base directory: /
# - Publish directory: .next
```

### Railway
```bash
railway login
railway new
railway add
railway up
```

## 🔧 Database Migration

### Run Migrations
```bash
# After deployment, run database setup
npm run db:migrate

# Seed with sample data (optional)
npm run db:setup
```

### Manual Database Setup
```sql
-- Connect to your MySQL database and run:
CREATE DATABASE scuzi_meals;
USE scuzi_meals;

-- Run the schema from src/db/mysql-schema.ts
-- Or use Drizzle migrations
```

## 🔍 Health Checks

### Verify Deployment
```bash
# Check if app is running
curl https://your-app-url.vercel.app/api/health

# Test AI endpoint
curl -X POST https://your-app-url.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a healthy breakfast recipe"}'

# Test meal library
curl https://your-app-url.vercel.app/api/meals/library
```

## 📊 Monitoring Setup

### CloudWatch Logs
```bash
# AWS Lambda logs (if using serverless)
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/scuzi"

# View recent logs
aws logs tail /aws/lambda/scuzi-ai --follow
```

### Vercel Analytics
```bash
# Enable in Vercel dashboard
# Analytics → Enable Web Analytics
```

## 🚨 Troubleshooting

### Common Issues

1. **Bedrock Access Denied**
   ```bash
   # Ensure Bedrock models are enabled in your AWS region
   aws bedrock list-foundation-models --region us-east-1
   ```

2. **Database Connection Failed**
   ```bash
   # Check RDS security groups allow connections
   # Verify connection string format
   ```

3. **S3 Upload Errors**
   ```bash
   # Check bucket permissions and CORS settings
   aws s3api get-bucket-cors --bucket your-bucket-name
   ```

4. **Environment Variables Not Loading**
   ```bash
   # Verify all required variables are set
   # Check for typos in variable names
   ```

### Debug Mode
```bash
# Enable debug logging
export DEBUG=scuzi:*
npm start
```

## 🔐 Security Checklist

- [ ] All secrets stored in AWS Secrets Manager
- [ ] Environment variables configured in deployment platform
- [ ] Database access restricted to application
- [ ] S3 bucket has proper CORS and permissions
- [ ] HTTPS enabled for all endpoints
- [ ] Authentication configured properly

## 📈 Performance Optimization

### CDN Setup
```bash
# CloudFront distribution for S3 assets
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_meal_type ON meals(meal_type);
CREATE INDEX idx_meal_tags ON meals(tags);
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] AWS services provisioned
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] SSL certificate configured
- [ ] Domain configured (if custom)

Your Scuzi AI application should now be successfully deployed and accessible via your chosen platform!