# AWS DynamoDB Setup

## Table Schemas

### Products Table
- **Primary Key**: `id` (String)
- **GSI**: `CategoryIndex` - Query products by category
- **Attributes**: id, name, price, description, imageUrl, category, rating, reviewCount

### Users Table
- **Primary Key**: `id` (String)
- **GSI**: `EmailIndex` - Find users by email (for login)
- **Attributes**: id, email, password (hashed), name, createdAt

### Carts Table
- **Primary Key**: `userId` (String)
- **Attributes**: userId, items (List), updatedAt

### Orders Table
- **Primary Key**: `id` (String)
- **GSI**: `UserOrdersIndex` - Query orders by userId + createdAt
- **Attributes**: id, userId, items, total, shippingAddress, status, createdAt

## Local Development with DynamoDB Local

### 1. Install DynamoDB Local
```bash
# Using Docker (recommended)
docker run -p 8000:8000 amazon/dynamodb-local

# Or download from AWS
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
```

### 2. Create Tables Locally
```bash
cd backend
npm run dynamodb:create-tables
```

### 3. Migrate Data
```bash
npm run dynamodb:migrate
```

## AWS Production Setup

### 1. Create Tables in AWS
```bash
# Using AWS CLI
aws dynamodb create-table --cli-input-json file://aws/dynamodb-tables.json --region us-east-1

# Or use AWS Console or Terraform/CDK
```

### 2. Update Environment Variables
```bash
# .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
DYNAMODB_ENDPOINT=  # Leave empty for AWS, set to http://localhost:8000 for local
```

## Cost Estimation

With provisioned throughput (5 RCU / 5 WCU per table):
- **4 tables × $0.65/month** = ~$2.60/month
- **Free tier**: 25 GB storage + 25 RCU/WCU free

For low traffic, consider **On-Demand** billing mode instead.
