# 💻 Code Style Guide - Andy

**Version:** 1.0
**Created:** 22. November 2025
**Purpose:** Wie Code geschrieben und dokumentiert werden soll

---

## 🎯 KISS-Prinzip - "Weniger ist mehr"

### Keep It Simple, Stupid!
**Philosophie:** Einfacher Code ist besser als cleverer Code

### Warum wichtig für Andy?
- ✅ **6 Monate Erfahrung** - komplexer Code ist schwer zu verstehen
- ✅ **Debugging einfacher** - weniger kann schiefgehen
- ✅ **Maintenance einfacher** - Code muss später geändert werden
- ✅ **Lern-Effekt größer** - einfacher Code lehrt Patterns besser

---

## 🚫 Was VERMEIDEN (Over-Engineering!)

### ❌ Keine unnötige Verschachtelung
```typescript
// ❌ SCHLECHT: Zu verschachtelt
function processOrder(order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        if (order.total > 0) {
          // Eigentliche Logik hier...
        }
      }
    }
  }
}

// ✅ GUT: Early Returns (flacher Code)
function processOrder(order) {
  // Validierung zuerst, dann raus
  if (!order) throw new Error('No order');
  if (!order.items?.length) throw new Error('Empty order');
  if (order.total <= 0) throw new Error('Invalid total');

  // Eigentliche Logik hier (nicht verschachtelt!)
  // ...
}
```

### ❌ Keine komplexen One-Liners
```typescript
// ❌ SCHLECHT: Zu clever, schwer zu debuggen
const total = items.reduce((s,i)=>s+(i.p*i.q*(1-i.d)),0)*1.19;

// ✅ GUT: Klar und verständlich
const subtotal = items.reduce((sum, item) => {
  const itemPrice = item.price * item.quantity;
  const afterDiscount = itemPrice * (1 - item.discount);
  return sum + afterDiscount;
}, 0);

const total = subtotal * 1.19;  // → Add 19% tax
```

### ❌ Keine abstractions "für später"
```typescript
// ❌ SCHLECHT: "Vielleicht brauchen wir das mal"
interface BaseEntity<T> {
  id: string;
  created: Date;
  updated: Date;
  // ... 20 weitere Properties
}

class GenericRepository<T extends BaseEntity<T>> {
  // ... 500 Zeilen "flexible" Code
}

// ✅ GUT: Nur was JETZT gebraucht wird
interface Product {
  id: string;
  name: string;
  price: number;
}

async function getProduct(id: string): Promise<Product> {
  return await db.get('products', id);
}
```

### ❌ Keine "smarten" Patterns wenn einfach reicht
```typescript
// ❌ SCHLECHT: Factory + Builder + Strategy für 3 Produkte
class ProductFactory {
  createProduct(type: ProductType): IProduct {
    return new ProductBuilder()
      .withStrategy(new PricingStrategy())
      .withDecorator(new DiscountDecorator())
      // ... 50 Zeilen
  }
}

// ✅ GUT: Einfaches Object
function createProduct(name: string, price: number): Product {
  return { id: generateId(), name, price };
}
```

---

## ✅ Was ANSTREBEN (Einfachheit!)

### ✅ Flacher Code (max 2-3 Ebenen)
```typescript
// ✅ GUT
async function addToCart(userId: string, productId: string) {
  // Step 1: Validate
  const product = await getProduct(productId);
  if (!product) throw new Error('Product not found');

  // Step 2: Check stock
  const available = product.stock - product.reserved;
  if (available < 1) throw new Error('Out of stock');

  // Step 3: Add to cart
  await cart.addItem(userId, product);

  return { success: true };
}
```

### ✅ Kleine Functions (1 Sache machen)
```typescript
// ✅ GUT: Jede Function macht EINE Sache

async function validateStock(product: Product): Promise<boolean> {
  const available = product.stock - product.reserved;
  return available > 0;
}

async function addToCart(userId: string, productId: string) {
  const product = await getProduct(productId);

  if (!await validateStock(product)) {
    throw new Error('Out of stock');
  }

  await cart.addItem(userId, product);
}
```

### ✅ Klare Namen (selbsterklärend)
```typescript
// ❌ SCHLECHT
const calc = (p, q) => p * q * 1.19;

// ✅ GUT
function calculateTotalWithTax(price: number, quantity: number): number {
  const subtotal = price * quantity;
  const tax = subtotal * 0.19;
  return subtotal + tax;
}
```

### ✅ Nur was JETZT gebraucht wird
**Regel:** "You Ain't Gonna Need It" (YAGNI)

```typescript
// ❌ SCHLECHT: Für "später"
interface User {
  id: string;
  email: string;
  // Vielleicht brauchen wir das mal:
  phoneNumber?: string;
  address?: Address;
  preferences?: UserPreferences;
  notifications?: Notification[];
  // ... 20 weitere "maybe" fields
}

// ✅ GUT: Nur was JETZT gebraucht wird
interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}

// Später wenn nötig: Erweitern
```

---

## 📝 Code-Kommentare

### Grundregel
**"Ausführlich bei Komplexität"**

- ✅ **Einfacher Code:** Self-documenting, minimale Comments
- ✅ **Komplexer Code:** Ausführlich dokumentiert
- ✅ **Business Logic:** Immer erklären WARUM (nicht nur WAS)

---

## 🎯 Kommentar-Levels

### Level 1: Function/Class Level (IMMER)
**JSDoc für jede exportierte Function/Class:**

```typescript
/**
 * Validates user authentication token and extracts user data
 *
 * @param token - JWT token from Authorization header
 * @param userPoolId - Cognito User Pool ID
 * @returns Decoded user data with email and role
 * @throws {UnauthorizedError} If token is invalid or expired
 *
 * @example
 * const user = await validateToken(token, 'eu-north-1_xyz');
 * // Returns: { email: 'andy@example.com', role: 'customer' }
 */
async function validateToken(token: string, userPoolId: string): Promise<UserData> {
  // Implementation...
}
```

### Level 2: Section Comments für Struktur
**Nutze Trenner für logische Blöcke:**

```typescript
// ============================================================================
// Authentication Logic
// ============================================================================

// Validate token
const decoded = jwt.verify(token, secret);

// Check expiration
if (decoded.exp < Date.now()) {
  throw new Error('Token expired');
}

// ============================================================================
// Database Operations
// ============================================================================

// Fetch user from database
const user = await db.getUser(decoded.sub);
```

**Alternative (kürzer):**
```typescript
// ----- Authentication -----
const decoded = jwt.verify(token, secret);

// ----- Database Lookup -----
const user = await db.getUser(decoded.sub);
```

### Level 3: Inline Erklärungen (nur bei Komplexität!)
**Format:** `// → Was passiert hier`

```typescript
// ✅ GUT: Komplexe Logik erklärt
const reserved = cart.items.reduce((sum, item) => {
  // → Sum up reserved stock across all cart items
  // → This prevents overselling during checkout
  return sum + (item.quantity * item.product.stock);
}, 0);

// ❌ UNNÖTIG: Offensichtlicher Code
const total = price + tax;  // → Add price and tax
```

**Wann Inline Comments:**
- ⚠️ Nicht-offensichtliche Business Logic
- ⚠️ Workarounds für bekannte Issues
- ⚠️ Performance-kritische Optimierungen
- ⚠️ Regex oder komplexe Berechnungen
- ⚠️ AWS-spezifische Eigenheiten

**Beispiele:**
```typescript
// ✅ Business Logic
if (stock - reserved < quantity) {
  // → Reserved stock counts against availability
  // → Prevents race condition during concurrent checkouts
  throw new Error('Insufficient stock');
}

// ✅ Workaround
const apiUrl = process.env.API_URL.replace(/\/$/, '');
// → Remove trailing slash to prevent double-slash in URLs
// → API Gateway doesn't route //api/cart correctly (Issue #18)

// ✅ AWS Quirk
await dynamodb.wait('tableNotExists', { tableName });
// → DynamoDB deletion is async, must wait for completion
// → Without wait: next operation fails with "table still exists"

// ❌ UNNÖTIG
const user = await getUser(id);  // → Get user from database
```

---

## 📐 Code-Block Formatierung in Markdown

### 1. Section Comments in Code
**Nutze für Struktur:**

```typescript
export async function processOrder(orderId: string) {
  // ============================================================================
  // Validation
  // ============================================================================

  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found');

  // ============================================================================
  // Stock Reservation
  // ============================================================================

  for (const item of order.items) {
    await reserveStock(item.productId, item.quantity);
  }

  // ============================================================================
  // Payment Processing
  // ============================================================================

  const payment = await stripe.createCharge({
    amount: order.total,
    currency: 'eur',
  });

  return { orderId, paymentId: payment.id };
}
```

### 2. Diff-Style bei Änderungen
**Zeige was geändert wurde:**

```diff
export async function addToCart(userId: string, productId: string) {
  const product = await getProduct(productId);

-  // OLD: Keine Stock-Validierung
-  await cart.addItem(userId, product);

+  // NEW: Check available stock before adding
+  const availableStock = product.stock - product.reserved;
+  if (availableStock < 1) {
+    throw new Error('Product out of stock');
+  }
+  await cart.addItem(userId, product);
}
```

### 3. Inline Erklärungen bei komplexer Logik
**Wichtige Zeilen kommentieren:**

```typescript
export async function calculateShipping(cart: Cart, address: Address): Promise<number> {
  // → Base shipping cost by region
  const baseRate = SHIPPING_RATES[address.country] || 9.99;

  // → Free shipping over 50 EUR threshold
  if (cart.total > 50) return 0;

  // → Weight-based surcharge for heavy items (>10kg)
  const weight = cart.items.reduce((sum, item) =>
    sum + (item.product.weight * item.quantity), 0
  );
  const surcharge = weight > 10 ? (weight - 10) * 0.5 : 0;

  // → Final cost: base + surcharge, max 19.99
  return Math.min(baseRate + surcharge, 19.99);
}
```

---

## 🌍 Zweisprachigkeit: EN/DE

### Code immer auf Englisch
```typescript
// ✅ RICHTIG
async function validateUserToken(token: string): Promise<User> {
  // → Verify JWT signature and expiration
  const decoded = jwt.verify(token, secret);
  return { email: decoded.email, role: decoded.role };
}

// ❌ FALSCH
async function validiereBenutzerToken(token: string): Promise<Benutzer> {
  // Kommentar auf Deutsch
  const entschlüsselt = jwt.verify(token, secret);
  return { email: entschlüsselt.email, rolle: entschlüsselt.rolle };
}
```

### Comments auf Englisch (Professional Standard)
```typescript
// ✅ RICHTIG
/**
 * Calculates total cart value including discounts and tax
 *
 * @param cart - Shopping cart with items
 * @param discountCode - Optional discount code
 * @returns Total amount in EUR
 */
export async function calculateTotal(
  cart: Cart,
  discountCode?: string
): Promise<number> {
  // → Sum up item prices
  const subtotal = cart.items.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );

  // → Apply discount if valid
  const discount = discountCode
    ? await getDiscount(discountCode)
    : 0;

  // → Add 19% VAT (German standard)
  const tax = (subtotal - discount) * 0.19;

  return subtotal - discount + tax;
}
```

**Ausnahme:** Sehr komplexe Business Logic kann DE Inline-Comment haben:
```typescript
if (stock - reserved < quantity) {
  // → Reservierte Artikel zählen gegen Verfügbarkeit
  // → Verhindert Überverkauf bei gleichzeitigen Checkouts
  throw new Error('Insufficient stock');
}
```

---

## 🏗️ Datei-Struktur

### Import Organization
```typescript
// External dependencies (alphabetical)
import { DynamoDB } from 'aws-sdk';
import express from 'express';
import jwt from 'jsonwebtoken';

// Internal modules (by layer)
import { requireAuth } from './middleware/auth';
import { Cart } from './models/cart';
import { Product } from './models/product';

// Types
import type { User, UserRole } from './types';

// Constants
import { JWT_SECRET, DYNAMODB_TABLE } from './config';
```

### File Header (bei komplexen Files)
```typescript
/**
 * @file cart-controller.ts
 * @description Shopping cart operations (add/remove/checkout)
 * @module controllers/cart
 *
 * Features:
 * - Stock reservation during add-to-cart
 * - Automatic cleanup of expired carts
 * - Supports guest carts (session-based)
 *
 * @see docs/architecture/cart-workflow.md
 */

// Implementation...
```

---

## 🎨 Naming Conventions

### Variables & Functions
```typescript
// ✅ Descriptive names
const availableStock = product.stock - product.reserved;
const isUserAuthenticated = Boolean(authToken);

async function calculateShippingCost(cart: Cart): Promise<number>

// ❌ Unclear abbreviations
const avl = prod.stk - prod.res;
const isAuth = Boolean(tok);

async function calcShip(c: Cart): Promise<number>
```

### Constants
```typescript
// ✅ SCREAMING_SNAKE_CASE für echte Konstanten
const MAX_CART_ITEMS = 50;
const DEFAULT_TIMEOUT_MS = 30000;
const JWT_EXPIRY_HOURS = 24;

// ✅ camelCase für Config Values
const dynamoDbTable = process.env.DYNAMODB_TABLE;
const apiGatewayUrl = process.env.API_URL;
```

### Booleans
```typescript
// ✅ is/has/should Prefix
const isAvailable = stock > 0;
const hasDiscount = Boolean(discountCode);
const shouldSendEmail = user.emailOptIn;

// ❌ Unclear
const available = stock > 0;
const discount = Boolean(discountCode);
```

---

## 🧪 Test Code

### Test Descriptions auf Englisch
```typescript
describe('Cart Controller', () => {
  describe('addToCart', () => {
    it('should add product to cart when stock available', async () => {
      // Arrange
      const product = { id: '123', stock: 10, reserved: 2 };

      // Act
      await addToCart(userId, product.id);

      // Assert
      expect(cart.items).toHaveLength(1);
    });

    it('should throw error when insufficient stock', async () => {
      // → Stock: 10, Reserved: 8, Available: 2
      const product = { id: '123', stock: 10, reserved: 8 };

      await expect(
        addToCart(userId, product.id, 5)  // → Try to add 5
      ).rejects.toThrow('Insufficient stock');
    });
  });
});
```

---

## 🚫 Was VERMEIDEN

### Vermeide:
- ❌ Deutsche Variablennamen
- ❌ Kommentare die Code wiederholen
- ❌ Zu viele Inline-Comments (Code sollte self-documenting sein)
- ❌ Veraltete Comments (nach Code-Änderung)
- ❌ TODOs ohne Issue-Link
- ❌ Commented-out Code (use git history!)

### Stattdessen:
- ✅ Englische Namen (Professional Standard)
- ✅ Comments erklären WARUM, nicht WAS
- ✅ Nur komplexe Stellen kommentieren
- ✅ Comments aktuell halten
- ✅ TODOs mit Issue: `// TODO(#42): Implement retry logic`
- ✅ Alten Code löschen (git history reicht)

---

## ✅ Quick Checklist für Code

Vor Commit:
- [ ] JSDoc für alle exports?
- [ ] Section Comments für logische Blöcke?
- [ ] Komplexe Logik inline erklärt?
- [ ] Alle Namen auf Englisch?
- [ ] Comments auf Englisch (außer Business Logic)?
- [ ] Keine veralteten Comments?
- [ ] Kein commented-out Code?
- [ ] TODOs mit Issue-Link?

---

## 📚 Beispiel: Komplett dokumentierte Function

```typescript
/**
 * Processes checkout for a shopping cart
 *
 * Steps:
 * 1. Validates cart and stock availability
 * 2. Creates pending order in database
 * 3. Reserves stock for order items
 * 4. Returns order with payment URL
 *
 * @param userId - User ID from JWT token
 * @param cartId - Shopping cart identifier
 * @returns Order object with Stripe payment URL
 * @throws {InsufficientStockError} If any item out of stock
 * @throws {EmptyCartError} If cart has no items
 *
 * @example
 * const order = await processCheckout('user_123', 'cart_456');
 * // Redirect to: order.paymentUrl
 */
export async function processCheckout(
  userId: string,
  cartId: string
): Promise<Order> {

  // ============================================================================
  // Validation
  // ============================================================================

  const cart = await getCart(cartId);

  if (!cart.items.length) {
    throw new EmptyCartError('Cannot checkout empty cart');
  }

  // → Check stock for all items before proceeding
  // → Prevents partial checkouts when some items unavailable
  for (const item of cart.items) {
    const availableStock = item.product.stock - item.product.reserved;

    if (availableStock < item.quantity) {
      throw new InsufficientStockError(
        `Only ${availableStock} available for ${item.product.name}`
      );
    }
  }

  // ============================================================================
  // Order Creation
  // ============================================================================

  // → Create in PENDING status first (before payment)
  // → Prevents inventory issues if payment fails
  const order = await createOrder({
    userId,
    items: cart.items,
    status: 'PENDING',
    total: calculateTotal(cart),
  });

  // ============================================================================
  // Stock Reservation
  // ============================================================================

  // → Reserve stock immediately after order creation
  // → Prevents overselling during payment processing
  for (const item of cart.items) {
    await reserveStock(item.product.id, item.quantity);
  }

  // ============================================================================
  // Payment Setup
  // ============================================================================

  // → Create Stripe Checkout Session
  // → User will be redirected to Stripe for payment
  const session = await stripe.checkout.sessions.create({
    customer_email: userId,
    line_items: cart.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.product.name },
        unit_amount: item.product.price * 100,  // → Stripe uses cents
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/order/${order.id}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cart`,
  });

  // ============================================================================
  // Cleanup
  // ============================================================================

  // → Empty cart after successful order creation
  // → Stock is now reserved in order, not cart
  await emptyCart(cartId);

  return {
    ...order,
    paymentUrl: session.url,
  };
}
```

---

**Remember:**
- 💻 **Code auf Englisch**
- 📝 **Ausführlich bei Komplexität**
- 🔷 **Section Comments für Struktur**
- 💬 **Inline Erklärungen bei nicht-offensichtlicher Logik**
- 🎯 **WARUM kommentieren, nicht WAS**
