#!/bin/bash

echo "🔍 Checking RDS instance status..."

# Get current status
STATUS=$(aws rds describe-db-instances --db-instance-identifier mealslabdb --query "DBInstances[0].DBInstanceStatus" --output text 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Error: Could not find RDS instance 'mealslabdb'"
    echo "💡 Make sure you have AWS CLI configured and the instance exists"
    exit 1
fi

echo "📊 Current Status: $STATUS"

if [ "$STATUS" = "available" ]; then
    echo "✅ RDS instance is ready!"
    
    # Get connection details
    echo ""
    echo "🔗 Connection Details:"
    aws rds describe-db-instances --db-instance-identifier mealslabdb --query "DBInstances[0].[Endpoint.Address,Endpoint.Port,DBName,MasterUsername]" --output table
    
    # Get endpoint for .env file
    ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier mealslabdb --query "DBInstances[0].Endpoint.Address" --output text)
    PORT=$(aws rds describe-db-instances --db-instance-identifier mealslabdb --query "DBInstances[0].Endpoint.Port" --output text)
    
    echo ""
    echo "📝 Add these to your .env.local file:"
    echo "RDS_HOST=$ENDPOINT"
    echo "RDS_PORT=$PORT"
    echo "RDS_USER=meals"
    echo "RDS_PASSWORD=your_password_here"
    echo "RDS_DATABASE=mealslab"
    
elif [ "$STATUS" = "creating" ]; then
    echo "⏳ Still creating... This usually takes 10-20 minutes"
    echo "💡 Run this script again in a few minutes"
    
elif [ "$STATUS" = "failed" ]; then
    echo "❌ Creation failed!"
    echo "🔍 Check AWS Console for error details"
    
else
    echo "📊 Status: $STATUS"
    echo "⏳ Waiting for completion..."
fi

echo ""
echo "🔄 To monitor continuously, run: watch -n 30 ./scripts/check-rds-status.sh"