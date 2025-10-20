# PostgreSQL RDS Database Setup

This guide will help you set up a PostgreSQL database on AWS RDS for storing meal data.

## 1. Create RDS Instance

### Using AWS Console:
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Standard create"
4. Select "PostgreSQL"
5. Choose your version (recommend PostgreSQL 15+)
6. Select template (Dev/Test for development, Production for production)
7. Configure:
   - DB instance identifier: `meals-database`
   - Master username: `meals_admin`
   - Master password: (generate secure password)
   - DB instance class: `db.t3.micro` (for development)
   - Storage: 20 GB (minimum)
   - Enable storage autoscaling if needed
8. Configure connectivity:
   - VPC: Default VPC
   - Public access: Yes (for development)
   - Security group: Create new or use existing
9. Additional configuration:
   - Initial database name: `meals_db`
   - Enable automated backups
   - Monitoring as needed

### Using AWS CLI:
```bash
aws rds create-db-instance \
  --db-instance-identifier meals-database \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username meals_admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --db-name meals_db \
  --publicly-accessible \
  --backup-retention-period 7 \
  --storage-encrypted
```

## 2. Configure Security Group

Ensure your RDS security group allows inbound connections on port 5432 from your IP address:

```bash
# Get your current IP
curl -s https://checkip.amazonaws.com

# Add inbound rule (replace with your IP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr YOUR_IP/32
```

## 3. Environment Configuration

1. Copy the environment template:
```bash
cp .env.postgres.example .env.local
```

2. Update `.env.local` with your RDS details:
```env
RDS_HOST=meals-database.xxxxxxxxx.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_USER=meals_admin
RDS_PASSWORD=your_secure_password
RDS_DATABASE=meals_db
NODE_ENV=development
```

## 4. Database Schema Setup

1. Generate migration files:
```bash
npm run db:generate
```

2. Run migrations to create tables:
```bash
npm run db:migrate
```

3. Set up initial data (optional):
```bash
npm run db:setup
```

## 5. Database Operations

### View Database in Drizzle Studio:
```bash
npm run db:studio
```

### Connect via psql:
```bash
psql -h your-rds-endpoint.region.rds.amazonaws.com -U meals_admin -d meals_db
```

## 6. Schema Overview

The database includes these main tables:

### Core Tables:
- `meals` - Main meal records with JSON fields for complex data
- `ingredients` - Normalized ingredient lookup table
- `meal_ingredients` - Junction table linking meals to ingredients with quantities
- `tags` - Normalized tags for categorization
- `meal_tags` - Junction table linking meals to tags

### Supporting Tables:
- `user_preferences` - User dietary preferences and goals
- `pantry_inventory` - User's available ingredients
- `shopping_list` - Generated shopping lists
- `meal_completions` - Tracking completed meals
- `whoop_health_data` - Health metrics integration
- `whoop_tokens` - Authentication tokens for WHOOP API

## 7. Sample Meal Data Structure

```typescript
const sampleMeal = {
  meal_id: "B-0001",
  meal_name: "Blueberry Almond Overnight Oats",
  tagline: "Fiber & Probiotic Power Bowl",
  prep_time: "5 minutes (plus 6+ hours refrigeration)",
  meal_type: "Breakfast",
  tags: ["Recovery", "Energy", "Better Performance"],
  ingredients: {
    serving_size: "1 serving",
    list: [
      { item: "Rolled oats", quantity: "1/2 cup" },
      { item: "Milk (dairy or unsweetened plant-based)", quantity: "1 cup" },
      // ... more ingredients
    ]
  },
  method: [
    "step 1: In a jar or bowl, combine oats, milk, yogurt...",
    // ... more steps
  ],
  nutrition: {
    serving_unit: "per 1 serving",
    summary: "High in protein and fiber...",
    details: {
      "Calories": "380 kcal",
      "Protein": "20 g",
      // ... more nutrition facts
    }
  },
  why_this_meal: "This make-ahead breakfast combines..."
};
```

## 8. Usage Examples

```typescript
import { insertMeal, getMealById, getMealsByType } from './src/db/meal-utils';

// Insert a new meal
await insertMeal(mealData);

// Get meal by ID
const meal = await getMealById("B-0001");

// Get all breakfast meals
const breakfastMeals = await getMealsByType("Breakfast");

// Search by tags
const recoveryMeals = await getMealsByTags(["Recovery"]);

// Search by ingredient
const oatMeals = await searchMealsByIngredient("Rolled oats");
```

## 9. Production Considerations

- Enable SSL connections in production
- Use connection pooling
- Set up read replicas for scaling
- Configure automated backups
- Monitor performance with CloudWatch
- Use AWS Secrets Manager for credentials
- Implement proper IAM roles and policies

## 10. Troubleshooting

### Connection Issues:
- Check security group rules
- Verify RDS instance is publicly accessible (for development)
- Confirm endpoint and port are correct
- Test with psql command line tool

### Migration Issues:
- Ensure database exists before running migrations
- Check user permissions
- Verify environment variables are set correctly

### Performance Issues:
- Add indexes for frequently queried columns
- Use EXPLAIN ANALYZE to identify slow queries
- Consider connection pooling for high traffic