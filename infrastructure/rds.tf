# RDS PostgreSQL instance for meals database
resource "aws_db_instance" "meals_database" {
  identifier = "meals-database"
  
  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp2"
  storage_encrypted    = true
  
  # Database configuration
  db_name  = "meals_db"
  username = "meals_admin"
  password = var.db_password
  
  # Network configuration
  publicly_accessible = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Performance Insights
  performance_insights_enabled = true
  
  # Deletion protection
  deletion_protection = false # Set to true for production
  
  tags = {
    Name        = "meals-database"
    Environment = var.environment
    Project     = "meals-app"
  }
}

# Security group for RDS
resource "aws_security_group" "rds_sg" {
  name_prefix = "meals-rds-"
  description = "Security group for meals RDS instance"
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this to your IP in production
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "meals-rds-security-group"
  }
}

# IAM role for RDS monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "rds-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Variables
variable "db_password" {
  description = "Password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

# Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.meals_database.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.meals_database.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.meals_database.db_name
}