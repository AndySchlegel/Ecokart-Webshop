# EcoKart Backend API

Express.js REST API für den EcoKart Sportshop.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📋 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "environment": "development"
}
```

---

#### Get All Products
```http
GET /api/products
```

**Response:**
```json
{
  "items": [
    {
      "id": "prod-001",
      "name": "Air Performance Runner",
      "price": 149.99,
      "description": "Hochleistungs-Laufschuh...",
      "imageUrl": "https://...",
      "category": "shoes",
      "stock": 50,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

#### Get Single Product
```http
GET /api/products/:id
```

**Response:**
```json
{
  "id": "prod-001",
  "name": "Air Performance Runner",
  "price": 149.99,
  ...
}
```

**Error (404):**
```json
{
  "error": "Product not found"
}
```

---

#### Create Product
```http
POST /api/products
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Product",
  "price": 99.99,
  "description": "Product description",
  "imageUrl": "https://example.com/image.jpg",
  "category": "shoes",
  "stock": 100
}
```

**Response (201):**
```json
{
  "id": "generated-uuid",
  "name": "New Product",
  "price": 99.99,
  ...
}
```

**Error (400):**
```json
{
  "error": "Missing required fields: name, price, description, imageUrl"
}
```

---

#### Update Product
```http
PUT /api/products/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "price": 79.99,
  "stock": 75
}
```

**Response:**
```json
{
  "id": "prod-001",
  "price": 79.99,
  "stock": 75,
  "updatedAt": "2025-01-15T11:00:00Z",
  ...
}
```

---

#### Delete Product
```http
DELETE /api/products/:id
```

**Response (204):** No Content

**Error (404):**
```json
{
  "error": "Product not found"
}
```

---

## 🗄️ Database

### Current: JSON File

Daten gespeichert in: `src/data/products.json`

**Struktur:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "price": "number",
      "description": "string",
      "imageUrl": "string",
      "category": "string (optional)",
      "stock": "number (optional)",
      "createdAt": "ISO 8601 string",
      "updatedAt": "ISO 8601 string"
    }
  ]
}
```

### Future: AWS DynamoDB

Migration vorbereitet für:
- Table: `ecokart-products`
- Partition Key: `id` (String)
- On-Demand Billing

---

## ⚙️ Configuration

### Environment Variables

Kopiere `.env.example` zu `.env`:

```bash
cp .env.example .env
```

**Variablen:**

```env
# Server
PORT=4000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# Database
DB_TYPE=json
DB_PATH=./src/data/products.json
```

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── index.ts              # Server Entry Point
│   ├── routes/
│   │   └── productRoutes.ts  # Product Routes
│   ├── controllers/
│   │   └── productController.ts  # Business Logic
│   ├── models/
│   │   └── Product.ts        # TypeScript Types
│   ├── config/
│   │   └── database.ts       # Database Service
│   └── data/
│       └── products.json     # JSON Database
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

---

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test get products
curl http://localhost:4000/api/products

# Test create product
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "description": "Test",
    "imageUrl": "https://example.com/test.jpg"
  }'
```

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Start with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

---

## 🚀 AWS Migration Checklist

- [ ] Setup DynamoDB Table
- [ ] Implement DynamoDB Service
- [ ] Environment-based DB switching
- [ ] Data migration script
- [ ] Lambda deployment
- [ ] API Gateway setup
- [ ] CloudWatch logging

---

## 📝 Notes

- UUIDs werden automatisch generiert
- Timestamps (createdAt, updatedAt) sind ISO 8601
- CORS ist aktiviert für Frontend
- Alle Preise in EUR
