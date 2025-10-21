# RDS MySQL Database for Scuzi Meal Library System

# Use default VPC and subnets for simplicity
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Create DB subnet group using default subnets
resource "aws_db_subnet_group" "scuzi_meals_subnet_group" {
  name       = "scuzi-meals-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name = "Scuzi Meals DB subnet group"
  }
}

# Use default VPC for simplicity (already defined above)

# Security group for RDS
resource "aws_security_group" "scuzi_meals_rds_sg" {
  name_prefix = "scuzi-meals-rds-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allow from anywhere - restrict this in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "scuzi-meals-rds-security-group"
  }
}

# Generate random password for RDS
resource "random_password" "scuzi_meals_db_password" {
  length  = 16
  special = true
}

# Store password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "scuzi_meals_db_credentials" {
  name        = "scuzi-meals-db-credentials"
  description = "Database credentials for Scuzi Meals RDS instance"
}

resource "aws_secretsmanager_secret_version" "scuzi_meals_db_credentials" {
  secret_id = aws_secretsmanager_secret.scuzi_meals_db_credentials.id
  secret_string = jsonencode({
    username = "scuzi_admin"
    password = random_password.scuzi_meals_db_password.result
    engine   = "mysql"
    host     = aws_db_instance.scuzi_meals_db.endpoint
    port     = 3306
    dbname   = "scuzi_meals"
  })
}

# RDS MySQL Instance
resource "aws_db_instance" "scuzi_meals_db" {
  identifier = "scuzi-meals-database"

  # Engine Configuration
  engine         = "mysql"
  engine_version = "8.0.43"  # Latest available MySQL version
  instance_class = "db.t3.micro"  # Free tier eligible

  # Database Configuration
  db_name  = "scuzi_meals"
  username = "scuzi_admin"
  password = random_password.scuzi_meals_db_password.result

  # Storage Configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.scuzi_meals_subnet_group.name
  vpc_security_group_ids = [aws_security_group.scuzi_meals_rds_sg.id]
  publicly_accessible    = true  # Set to false in production

  # Backup Configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Performance Configuration
  performance_insights_enabled = false  # Enable in production for monitoring
  monitoring_interval         = 0

  # Deletion Protection
  deletion_protection = false  # Set to true in production
  skip_final_snapshot = true   # Set to false in production

  # Parameter Group (optional customizations)
  parameter_group_name = "default.mysql8.0"

  tags = {
    Name        = "scuzi-meals-database"
    Environment = "development"
    Project     = "scuzi-ai-food-health"
  }
}

# Output the connection details
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.scuzi_meals_db.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.scuzi_meals_db.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.scuzi_meals_db.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.scuzi_meals_db.username
  sensitive   = true
}

output "secrets_manager_arn" {
  description = "ARN of the secrets manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.scuzi_meals_db_credentials.arn
}