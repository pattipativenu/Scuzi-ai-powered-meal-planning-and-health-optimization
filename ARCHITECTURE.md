# Scuzi AI - System Architecture

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15 App] --> B[React 19 Components]
        B --> C[Tailwind CSS + Framer Motion]
    end
    
    subgraph "AI Agent Core"
        D[AWS Bedrock Claude 3.5 Sonnet v2] --> E[Meal Planning Agent]
        E --> F[Recipe Generation]
        E --> G[Nutritional Analysis]
        E --> H[Health Data Processing]
    end
    
    subgraph "AWS Services"
        I[AWS Bedrock Titan G1V2] --> J[Image Generation]
        K[AWS S3] --> L[Meal Images Storage]
        M[AWS Secrets Manager] --> N[Credential Management]
        O[AWS DynamoDB] --> P[Chat History & Sessions]
        Q[AWS RDS MySQL] --> R[Meal Database]
    end
    
    subgraph "External Integrations"
        S[WHOOP API] --> T[Biometric Data]
        U[Better Auth] --> V[User Authentication]
    end
    
    A --> D
    A --> I
    A --> K
    A --> M
    A --> O
    A --> Q
    A --> S
    A --> U
    
    D --> I
    E --> Q
    E --> O
    T --> E
```

## 🤖 AI Agent Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Agent as AI Agent (Claude 3.5)
    participant WHOOP as WHOOP API
    participant DB as MySQL Database
    participant S3 as AWS S3
    participant Titan as Bedrock Titan

    User->>Frontend: Request meal plan
    Frontend->>WHOOP: Fetch biometric data
    WHOOP-->>Frontend: Return health metrics
    Frontend->>Agent: Send health data + preferences
    
    Agent->>Agent: Analyze biometric patterns
    Agent->>Agent: Process nutritional requirements
    Agent->>DB: Query meal database
    DB-->>Agent: Return matching meals
    
    Agent->>Agent: Generate personalized plan
    Agent->>Titan: Request meal images
    Titan-->>S3: Store generated images
    S3-->>Agent: Return image URLs
    
    Agent-->>Frontend: Return complete meal plan
    Frontend-->>User: Display personalized recommendations
```

## 🔄 Data Flow Architecture

```mermaid
flowchart LR
    subgraph "Input Sources"
        A[User Preferences]
        B[WHOOP Biometrics]
        C[Pantry Inventory]
        D[Chat Queries]
    end
    
    subgraph "AI Processing Layer"
        E[Claude 3.5 Sonnet v2]
        F[Nutritional Analysis Engine]
        G[Recipe Generation Logic]
        H[Health Pattern Recognition]
    end
    
    subgraph "Data Storage"
        I[MySQL - Meal Library]
        J[DynamoDB - User Sessions]
        K[S3 - Generated Images]
    end
    
    subgraph "Output Generation"
        L[Personalized Meal Plans]
        M[Recipe Recommendations]
        N[Shopping Lists]
        O[Nutritional Insights]
    end
    
    A --> E
    B --> H
    C --> G
    D --> E
    
    E --> F
    F --> G
    H --> E
    
    E --> I
    E --> J
    G --> K
    
    E --> L
    G --> M
    F --> N
    H --> O
```

## 🏛️ Component Architecture

### Frontend Components
- **Navigation System**: Responsive navigation with mobile optimization
- **AI Chat Interface**: Real-time conversation with Claude 3.5 Sonnet
- **Meal Planning Dashboard**: Interactive meal plan generation and management
- **WHOOP Integration Panel**: Biometric data visualization and sync
- **Pantry Management**: Inventory tracking and shopping list generation

### Backend Services
- **Authentication Service**: Better Auth with session management
- **AI Agent Orchestrator**: Coordinates between AWS Bedrock and application logic
- **Data Processing Pipeline**: Handles WHOOP data ingestion and analysis
- **Image Generation Service**: Manages Titan G1V2 image creation workflow
- **Database Abstraction Layer**: Unified interface for MySQL and DynamoDB

### AWS Infrastructure
- **Bedrock Integration**: Claude 3.5 Sonnet v2 for AI agent capabilities
- **S3 Storage**: Scalable image and asset storage with CDN
- **Secrets Management**: Secure credential storage and rotation
- **Database Services**: RDS MySQL for structured data, DynamoDB for sessions

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        A[AWS Secrets Manager] --> B[Environment Variables]
        C[Better Auth] --> D[Session Management]
        E[Input Validation] --> F[SQL Injection Prevention]
        G[OAuth 2.0] --> H[WHOOP API Security]
    end
    
    subgraph "Data Protection"
        I[Encrypted Storage] --> J[AWS RDS Encryption]
        K[Secure Transmission] --> L[HTTPS/TLS]
        M[Access Control] --> N[IAM Roles & Policies]
    end
    
    A --> I
    C --> K
    E --> M
    G --> I
```

## 📊 Performance Architecture

### Scalability Features
- **Serverless Functions**: Auto-scaling API endpoints
- **Database Connection Pooling**: Efficient resource utilization
- **CDN Integration**: Global content delivery via AWS CloudFront
- **Caching Strategies**: Optimized response times for frequent queries

### Monitoring & Observability
- **CloudWatch Integration**: Performance metrics and logging
- **Error Tracking**: Comprehensive error handling and reporting
- **Health Checks**: Automated system health monitoring
- **Performance Analytics**: Real-time application performance insights

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        A[Local Development] --> B[Git Repository]
    end
    
    subgraph "CI/CD Pipeline"
        B --> C[GitHub Actions]
        C --> D[Build Process]
        D --> E[Testing Suite]
    end
    
    subgraph "Production Environment"
        E --> F[Vercel Deployment]
        F --> G[AWS Infrastructure]
        G --> H[Global CDN]
    end
    
    subgraph "Monitoring"
        H --> I[CloudWatch Metrics]
        I --> J[Performance Dashboard]
    end
```

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Components**: Radix UI for accessibility

### Backend
- **Runtime**: Node.js with TypeScript
- **Database ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **API**: RESTful endpoints with Next.js API routes

### AWS Services
- **AI/ML**: Bedrock (Claude 3.5 Sonnet v2, Titan G1V2)
- **Storage**: S3, RDS MySQL, DynamoDB
- **Security**: Secrets Manager, IAM
- **Monitoring**: CloudWatch

### External APIs
- **Health Data**: WHOOP API with OAuth 2.0
- **Authentication**: GitHub/Google OAuth

This architecture ensures scalability, security, and optimal performance while maintaining the flexibility to add new features and integrations.