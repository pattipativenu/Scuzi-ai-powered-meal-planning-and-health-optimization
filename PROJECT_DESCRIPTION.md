# Scuzi AI - Intelligent Food & Health Companion 

## 🎯 Project Overview

Scuzi AI is a comprehensive, AI-powered meal planning and health optimization platform that combines cutting-edge artificial intelligence with real-time fitness data to deliver personalized nutrition recommendations. Built with Next.js 15 and powered by Claude 3.5 Sonnet, this application represents the future of personalized health and nutrition technology.

## 🚀 What Makes This Project Special

### 1. **Advanced AI Integration**

- **Claude 3.5 Sonnet Multimodal AI**: Processes both text and images for comprehensive food analysis
- **AWS Bedrock Titan G1V2**: Generates high-quality, appetizing meal images automatically
- **Intelligent Recipe Generation**: Creates complete recipes from leftover ingredients with nutritional analysis
- **Smart Meal Planning**: Generates 1-28 meal plans for up to 7 days with perfect nutritional balance

### 2. **Advanced WHOOP Health Data Integration**

- **Comprehensive Biometric Collection**: Syncs 7 key health metrics from WHOOP devices:
  - **Recovery Score**: Daily readiness assessment
  - **Sleep Performance**: Sleep quality and duration analysis
  - **Sleep Debt**: Cumulative sleep deficit tracking
  - **Calories Burned**: Precise energy expenditure data
  - **HRV (Heart Rate Variability)**: Autonomic nervous system health
  - **Resting Heart Rate**: Cardiovascular fitness indicator
  - **Blood Oxygen**: Respiratory efficiency measurement
- **AI-Driven Meal Personalization**: Claude 3.5 Sonnet v2 analyzes this biometric data to identify user's physiological needs and selects perfectly matched meals
- **Recovery-Focused Nutrition**: Automatically adjusts protein, carbohydrate, and micronutrient recommendations based on strain and recovery data
- **OAuth 2.0 Implementation**: Enterprise-grade secure authentication flow

### 3. **Comprehensive Meal Library System**

- **90+ Pre-loaded Meals**: Curated collection of high-protein, gut-healthy recipes
- **Automated Image Generation**: Each meal gets a professionally generated image
- **Nutritional Database**: Complete macro and micronutrient information for every meal
- **CSV Import/Export**: Bulk meal management capabilities

## 🏗️ Technical Architecture

### **Frontend Excellence**

- **Next.js 15 with App Router**: Latest React 19 features and server components
- **TypeScript**: Full type safety across the entire application
- **Tailwind CSS + Framer Motion**: Beautiful, responsive UI with smooth animations
- **Radix UI Components**: Accessible, professional component library

### **Backend Infrastructure**

- **AWS Multi-Service Integration**:
  - **RDS MySQL**: Primary meal database with 90+ recipes
  - **DynamoDB**: Real-time chat history and user interactions
  - **S3**: Meal image storage and management
  - **Secrets Manager**: Secure credential management
  - **Bedrock**: AI model access and image generation

### **Dual AI Model Architecture**

- **AWS Bedrock Claude 3.5 Sonnet v2**: Powers two distinct application modes:
  - **Scuzi Chat Page**: On-demand meal creation from leftovers, nutrition analysis of prepared meals, product health assessments, and grocery receipt meal planning
  - **Plan Ahead Page**: Analyzes WHOOP biometric data to understand user's physiological struggles and generates personalized weekly meal plans
- **AWS Bedrock Titan G1V2**: Dedicated image generation model creating professional food photography
- **Intelligent Data Processing**: AI interprets complex health metrics to deliver precise nutritional recommendations
- **Multimodal Capabilities**: Processes text, images, and biometric data simultaneously

## 🔧 Key Features Developed

### **1. Scuzi Chat Page - On-Demand AI Assistant**

```typescript
// Claude 3.5 Sonnet v2 powered intelligent chat
- Recipe Generation: Creates complete meals from leftover ingredients
- Nutrition Analysis: Analyzes prepared/cooked meals for macro/micronutrients
- Product Health Check: Evaluates packaged foods and suggests consumption safety
- Grocery Receipt Planning: Converts shopping receipts into meal plans
- Image Recognition: Processes food photos for instant analysis
- Real-time Conversations: Context-aware dialogue with memory
```

### **2. Plan Ahead Page - WHOOP-Integrated Meal Planning**

```typescript
// Claude 3.5 Sonnet v2 analyzes WHOOP biometric data
- Biometric Analysis: Processes 7 key WHOOP health metrics
- Physiological Assessment: Identifies user's recovery and performance gaps
- Personalized Meal Selection: Matches meals to specific health needs
- Weekly Planning: Generates 7-day meal plans optimized for recovery
- Nutritional Optimization: Adjusts macros based on strain and sleep data
```

### **3. Automated Meal Planning**

```typescript
// Sophisticated meal generation system
- Library-based meal selection (90+ meals)
- AI-powered meal creation
- Nutritional balance optimization
- Weekly meal plan generation
```

### **4. AWS Bedrock Titan G1V2 Image Generation**

```typescript
// Intelligent image creation system
- Context-Aware Generation: Only creates images for complete recipes
- Professional Quality: Restaurant-style food photography
- Selective Processing: Skips suggestions and health advice
- Automatic Storage: Direct S3 integration with CDN delivery
- Optimized Performance: Reduces unnecessary API calls and costs
```

## 🎨 User Experience Features

### **Intuitive Interface**

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme switching
- **Smooth Animations**: Framer Motion powered transitions
- **Accessible Components**: WCAG compliant UI elements

### **Smart Interactions**

- **Drag & Drop**: Easy image uploads for meal analysis
- **Real-time Chat**: Instant AI responses with typing indicators
- **History Tracking**: Complete conversation and meal plan history
- **Export Capabilities**: Download meal plans and shopping lists

## 🔒 Security & Performance

### **Enterprise-Grade Security**

- **AWS Secrets Manager**: All sensitive credentials securely stored
- **Environment Variable Management**: Proper separation of dev/prod configs
- **Input Validation**: Comprehensive sanitization of user inputs
- **OAuth 2.0**: Industry-standard authentication protocols

### **Performance Optimizations**

- **Server Components**: Reduced client-side JavaScript
- **Image Optimization**: Next.js automatic image optimization
- **Database Indexing**: Optimized queries for fast meal retrieval
- **CDN Integration**: Global content delivery via AWS CloudFront

## 📊 Data Management

### **Multi-Database Architecture**

1. **AWS RDS MySQL**: Primary meal library and nutritional data
2. **DynamoDB**: Real-time chat history with TTL for automatic cleanup
3. **Turso SQLite**: User authentication and session management
4. **AWS S3**: Meal images and static assets

### **Data Flow**

```
User Input → AI Processing → Database Storage → Response Generation → Image Creation → Final Delivery
```

## 🧪 Advanced AI Capabilities

### **Claude 3.5 Sonnet v2 - Dual Mode Processing**

#### **Scuzi Chat Mode**

- **Leftover Analysis**: Identifies ingredients from photos and creates complete recipes
- **Meal Nutrition Scanning**: Analyzes prepared meals for detailed nutritional breakdown
- **Product Safety Assessment**: Evaluates packaged foods for health risks and consumption recommendations
- **Receipt-to-Meal Conversion**: Transforms grocery receipts into structured meal plans
- **Real-time Guidance**: Provides cooking tips and nutritional advice

#### **Plan Ahead Mode - WHOOP Integration**

- **Biometric Data Processing**: Analyzes 7-14 WHOOP health metrics simultaneously
- **Physiological Pattern Recognition**: Identifies recovery deficits and performance bottlenecks
- **Targeted Meal Selection**: Matches specific meals to address health gaps
- **Nutritional Optimization**: Calculates precise macro/micronutrient needs based on:
  - Recovery score trends
  - Sleep debt accumulation
  - HRV patterns
  - Caloric expenditure data
  - Cardiovascular stress indicators

### **Titan G1V2 - Professional Image Generation**

- **Recipe-Specific Creation**: Generates images only for complete meal recipes
- **Style Consistency**: Maintains professional food photography aesthetic
- **Cost Optimization**: Intelligent filtering prevents unnecessary image generation

## 🚀 Deployment & Scalability

### **Cloud-Native Architecture**

- **Vercel Deployment**: Automatic scaling and global CDN
- **AWS Integration**: Enterprise-grade cloud services
- **Environment Management**: Separate dev/staging/production configs
- **Monitoring**: CloudWatch integration for performance tracking

### **Scalability Features**

- **Serverless Functions**: Auto-scaling API endpoints
- **Database Connection Pooling**: Efficient resource utilization
- **Image CDN**: Global content delivery
- **Caching Strategies**: Optimized response times

## 🎯 Business Value

### **For Users**

- **Personalized Nutrition**: Tailored meal plans based on fitness data
- **Time Saving**: Instant recipe generation from available ingredients
- **Health Optimization**: Science-based nutrition recommendations
- **Convenience**: All-in-one meal planning and health tracking

### **For Developers**

- **Modern Tech Stack**: Latest Next.js, React, and TypeScript
- **Clean Architecture**: Modular, maintainable codebase
- **Comprehensive Documentation**: Well-documented APIs and components
- **Extensible Design**: Easy to add new features and integrations

## 🔮 Future Enhancements

### **Planned Features**

- **Mobile App**: React Native companion app
- **Social Features**: Meal sharing and community recipes
- **Grocery Integration**: Direct ordering from meal plans
- **Wearable Expansion**: Support for Apple Health, Fitbit, etc.

### **Technical Roadmap**

- **GraphQL API**: More efficient data fetching
- **Real-time Collaboration**: Shared meal planning
- **Advanced Analytics**: Detailed nutrition tracking
- **AI Model Fine-tuning**: Custom nutrition models

## 📈 Project Impact

This project demonstrates mastery of:

- **Full-Stack Development**: Complete end-to-end application
- **AI Integration**: Advanced machine learning implementation
- **Cloud Architecture**: Enterprise-grade AWS services
- **User Experience**: Intuitive, accessible interface design
- **Security**: Industry-standard security practices
- **Performance**: Optimized for speed and scalability

## 🏆 Technical Achievements

1. **Seamless WHOOP Integration**: Complete OAuth 2.0 implementation with real-time data sync
2. **Advanced AI Chat**: Multimodal AI with image processing and intelligent responses
3. **Smart Image Generation**: Context-aware image creation only for complete recipes
4. **Scalable Architecture**: Cloud-native design ready for enterprise deployment
5. **Comprehensive Testing**: Robust error handling and edge case management

## 🛠️ Development Environment

**Built with Kiro IDE** - This entire project was developed using Kiro IDE, showcasing the power of AI-assisted development for creating sophisticated, production-ready applications.

---

**This project represents the cutting-edge intersection of artificial intelligence, biometric health data, and personalized nutrition science. By combining WHOOP's comprehensive health metrics with AWS Bedrock's advanced AI models, we've created a platform that doesn't just suggest meals—it understands your body's needs and delivers precisely what you need for optimal health and performance.**
