# Step 1: DynamoDB Tables erstellen

**Ziel:** DynamoDB Tables in AWS erstellen und mit Daten füllen

**Dauer:** ~10-15 Minuten
**Kosten:** ~$0-2/Monat (Free Tier: 25 GB)

---

## 🎓 Was ist DynamoDB?

**DynamoDB** = Amazons NoSQL Datenbank (wie MongoDB, aber managed)

**Vorteile:**
- ✅ Fully Managed (kein Server)
- ✅ Automatisches Scaling
- ✅ Single-digit millisecond Performance
- ✅ Built-in Security
- ✅ Pay-per-use

**Unsere 4 Tables:**
1. **ecokart-products** - Alle Produkte (32 Sneakers/Apparel)
2. **ecokart-users** - User Accounts
3. **ecokart-carts** - Shopping Carts
4. **ecokart-orders** - Bestellungen

---

## 📐 Table Design

### 1. Products Table

**Primary Key:** `id` (String)
**GSI:** `CategoryIndex` (category)

**Warum GSI?** Um Produkte nach Kategorie abzufragen (z.B. "alle Schuhe")

**Beispiel-Item:**
```json
{
  "id": "prod-001",
  "name": "Air Max 90 OG",
  "price": 139.99,
  "category": "shoes",
  "imageUrl": "/pics/air-max-90.jpg",
  "rating": 4.8,
  "reviewCount": 234
}
```

---

### 2. Users Table

**Primary Key:** `id` (String)
**GSI:** `EmailIndex` (email)

**Warum GSI?** Um User beim Login zu finden (via Email)

**Beispiel-Item:**
```json
{
  "id": "user-123",
  "email": "andy@example.com",
  "password": "$2b$10$hashed...",
  "name": "Andy",
  "createdAt": "2025-01-26T10:00:00Z"
}
```

---

### 3. Carts Table

**Primary Key:** `userId` (String)

**Warum kein GSI?** Ein User = Ein Cart (1:1 Beziehung)

**Beispiel-Item:**
```json
{
  "userId": "user-123",
  "items": [
    {
      "productId": "prod-001",
      "name": "Air Max 90",
      "quantity": 2,
      "price": 139.99
    }
  ],
  "updatedAt": "2025-01-26T12:00:00Z"
}
```

---

### 4. Orders Table

**Primary Key:** `id` (String)
**GSI:** `UserOrdersIndex` (userId + createdAt)

**Warum GSI?** Um alle Bestellungen eines Users zu finden, sortiert nach Datum

**Beispiel-Item:**
```json
{
  "id": "order-456",
  "userId": "user-123",
  "items": [...],
  "total": 279.98,
  "status": "pending",
  "shippingAddress": {...},
  "createdAt": "2025-01-26T13:00:00Z"
}
```

---

## 🛠️ Setup-Schritte

### Schritt 1.1: AWS SDK Dependencies installieren

```bash
cd backend
npm install
```

**Was passiert?**
- Installiert `@aws-sdk/client-dynamodb` v3.637.0
- Installiert `@aws-sdk/lib-dynamodb` v3.637.0

---

### Schritt 1.2: DynamoDB Tables erstellen

```bash
cd backend
npm run dynamodb:create-tables -- --profile Teilnehmer-729403197965
```

**Was passiert?**
- Liest `backend/aws/dynamodb-tables.json`
- Erstellt 4 Tables in AWS (Region: eu-north-1)
- Konfiguriert Primary Keys & GSIs

**Output (Erfolg):**
```
🚀 Creating DynamoDB tables...

Creating table: ecokart-products
✅ ecokart-products created successfully

Creating table: ecokart-users
✅ ecokart-users created successfully

Creating table: ecokart-carts
✅ ecokart-carts created successfully

Creating table: ecokart-orders
✅ ecokart-orders created successfully

✅ All tables created/verified successfully!
```

---

### Schritt 1.3: Daten migrieren (JSON → DynamoDB)

```bash
npm run dynamodb:migrate -- --profile Teilnehmer-729403197965
```

**Was passiert?**
- Liest lokale JSON Files (`backend/src/data/products.json`)
- Schreibt 32 Produkte in DynamoDB
- Erstellt Batches (max 25 Items pro Request)

**Output (Erfolg):**
```
🚀 Starting migration to DynamoDB...

Endpoint: AWS Cloud

📦 Migrating 32 products...
  ✅ Batch 1 migrated (25 items)
  ✅ Batch 2 migrated (7 items)
✅ All products migrated successfully!

ℹ️  No users.json found, skipping users migration
ℹ️  No carts.json found, skipping carts migration
ℹ️  No orders.json found, skipping orders migration

✨ Migration completed successfully!
```

---

### Schritt 1.4: Verifizierung

**In AWS Console:**
1. Öffne https://eu-north-1.console.aws.amazon.com/dynamodbv2
2. Klicke auf "Tables"
3. Du siehst:
   - ecokart-products (32 Items)
   - ecokart-users (0 Items)
   - ecokart-carts (0 Items)
   - ecokart-orders (0 Items)

**Via CLI:**
```bash
# Liste alle Tables
aws dynamodb list-tables --region eu-north-1 --profile Teilnehmer-729403197965

# Zeige Products Count
aws dynamodb scan --table-name ecokart-products --select COUNT --region eu-north-1 --profile Teilnehmer-729403197965
```

---

## 🎯 Erfolgs-Kriterien

✅ 4 DynamoDB Tables existieren in eu-north-1
✅ ecokart-products hat 32 Items
✅ Alle GSIs sind aktiv (Index Status: ACTIVE)
✅ Keine Fehler in CLI Output

---

## 🐛 Troubleshooting

### Problem: "ResourceInUseException"
**Bedeutung:** Table existiert bereits
**Lösung:** Normal! Script überspringt automatisch

### Problem: "ExpiredToken"
**Bedeutung:** SSO Session abgelaufen
**Lösung:**
```bash
aws sso login --profile Teilnehmer-729403197965
```

### Problem: "AccessDeniedException"
**Bedeutung:** Keine Berechtigung für DynamoDB
**Lösung:** Prüfe ob Rolle "Teilnehmer" DynamoDB-Rechte hat

---

## 📊 Kosten-Check

**DynamoDB Provisioned Throughput:**
- 4 Tables × 5 RCU/WCU = ~$2.60/Monat
- **Free Tier:** 25 RCU/WCU gratis → **$0/Monat** ✅

**On-Demand Alternative:**
- $1.25 pro 1M Writes, $0.25 pro 1M Reads
- Bei wenig Traffic: **~$0.50/Monat**

---

## ✅ Nächster Schritt

Nach erfolgreichem Setup:
→ **Step 2: S3 Bucket für Product Images**

---

*Step 1 von 7 - DynamoDB Tables Setup*
