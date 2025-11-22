# 🔐 Cognito Backend Integration - Anleitung

## Übersicht

Diese Anleitung zeigt wie du die Cognito Authentication im Express Backend nutzt.

## 1. Middleware einbinden

### In `src/index.ts` (Express App Setup):

```typescript
import express from 'express';
import { attachCognitoUser } from './middleware/cognitoAuth';

const app = express();

// ... andere Middleware (cors, json parser, etc.) ...

// ✅ Cognito User an ALLE Requests anhängen
app.use(attachCognitoUser);

// ... deine Routes ...
```

**Was passiert:**
- Bei JEDEM Request wird `req.user` gesetzt (falls User eingeloggt)
- Bei nicht-eingeloggten Usern: `req.user = undefined`
- Kein Error! Routes entscheiden selbst ob Login nötig ist

## 2. Routes schützen

### Öffentliche Route (kein Login nötig)

```typescript
// src/routes/productRoutes.ts
import { Router } from 'express';

const router = Router();

// ✅ Öffentlich - jeder kann Produkte sehen
router.get('/api/products', async (req, res) => {
  // req.user kann undefined sein (ist OK!)
  const products = await getProducts();
  res.json(products);
});

export default router;
```

### Geschützte Route (Login erforderlich)

```typescript
// src/routes/cartRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/cognitoAuth';

const router = Router();

// ✅ Geschützt - nur eingeloggte User
router.post('/api/cart', requireAuth, async (req, res) => {
  // req.user ist GARANTIERT gesetzt (wegen requireAuth)
  const userId = req.user!.userId;  // ! = non-null assertion

  await addToCart(userId, req.body);
  res.json({ success: true });
});

export default router;
```

### Admin-Route (nur Admins)

```typescript
// src/routes/adminRoutes.ts
import { Router } from 'express';
import { requireAdmin } from '../middleware/cognitoAuth';

const router = Router();

// ✅ Nur Admins - prüft role === "admin"
router.post('/api/products', requireAdmin, async (req, res) => {
  // req.user ist gesetzt UND ist Admin
  const product = await createProduct(req.body);
  res.json(product);
});

export default router;
```

## 3. User-Info nutzen

### In Controllern

```typescript
// src/controllers/orderController.ts
import { getCurrentUser, getUserId } from '../middleware/cognitoAuth';

export async function createOrder(req: Request, res: Response) {
  // Methode 1: Ganzes User-Objekt
  const user = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(`Order von ${user.email} (${user.role})`);

  // Methode 2: Nur User ID
  const userId = getUserId(req);

  // Order erstellen
  const order = await createOrderInDB({
    userId,
    items: req.body.items,
    // ...
  });

  res.json(order);
}
```

### User-Info verfügbar in req.user

```typescript
interface AuthUser {
  userId: string;         // Cognito User ID (UUID)
  email: string;          // Email-Adresse
  role: string;           // "admin" oder "customer"
  emailVerified: boolean; // Email verifiziert?
}

// Beispiel Nutzung:
console.log(req.user?.userId);        // "a1b2c3d4-..."
console.log(req.user?.email);         // "test@example.com"
console.log(req.user?.role);          // "customer"
console.log(req.user?.emailVerified); // true
```

## 4. Route-by-Route Übersicht

### Öffentliche Routes (KEINE Auth)

```typescript
// Jeder kann zugreifen
router.get('/api/products', productController.list);
router.get('/api/products/:id', productController.getById);
router.get('/health', healthCheck);
```

### Customer Routes (requireAuth)

```typescript
// Nur eingeloggte User
router.post('/api/cart', requireAuth, cartController.addToCart);
router.get('/api/cart', requireAuth, cartController.getCart);
router.post('/api/orders', requireAuth, orderController.create);
router.get('/api/orders', requireAuth, orderController.getUserOrders);
router.get('/api/users/me', requireAuth, userController.getCurrentUser);
```

### Admin Routes (requireAdmin)

```typescript
// Nur Admins
router.post('/api/products', requireAdmin, productController.create);
router.put('/api/products/:id', requireAdmin, productController.update);
router.delete('/api/products/:id', requireAdmin, productController.delete);
router.get('/api/orders/all', requireAdmin, orderController.getAllOrders);
```

## 5. Migration von altem JWT Code

### Vorher (JWT Middleware)

```typescript
// ❌ ALT - wird ersetzt
import { verifyJWT } from './auth';

router.post('/api/cart', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyJWT(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ... cart logic ...
});
```

### Nachher (Cognito Middleware)

```typescript
// ✅ NEU - viel einfacher!
import { requireAuth } from '../middleware/cognitoAuth';

router.post('/api/cart', requireAuth, async (req, res) => {
  // User ist automatisch verfügbar in req.user
  const userId = req.user!.userId;

  // ... cart logic ...
});
```

## 6. Testing

### Lokal testen (ohne Lambda)

```typescript
// src/index.ts - Development Mode
if (process.env.NODE_ENV === 'development') {
  // Mock Cognito User für lokales Testing
  app.use((req, res, next) => {
    if (!req.user && req.headers['x-test-user']) {
      req.user = {
        userId: 'test-user-123',
        email: 'test@example.com',
        role: 'customer',
        emailVerified: true
      };
    }
    next();
  });
}
```

**Testing mit curl:**

```bash
# Ohne User (sollte 401 geben)
curl http://localhost:3000/api/cart

# Mit Mock User
curl -H "X-Test-User: true" http://localhost:3000/api/cart
```

### Mit echtem Cognito testen

```bash
# 1. Token holen
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id eu-north-1_XXXXX \
  --client-id YYYYYY \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=Test1234! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# 2. API aufrufen
curl -H "Authorization: Bearer $TOKEN" \
  https://YOUR-API.execute-api.eu-north-1.amazonaws.com/Prod/api/cart
```

## 7. Error Handling

### Typische Fehler

```typescript
// 401 Unauthorized - Kein/Ungültiger Token
{
  "error": "Unauthorized",
  "message": "Du musst eingeloggt sein"
}

// 403 Forbidden - Kein Admin
{
  "error": "Forbidden",
  "message": "Diese Aktion ist nur für Admins erlaubt"
}
```

### Custom Error Messages

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Bitte melde dich an um fortzufahren',
      loginUrl: '/auth/login'  // Frontend Login Page
    });
  }
  next();
}
```

## 8. TypeScript Tipps

### Type-Safe User Access

```typescript
// Mit Type Guard
function requiresUser(req: Request): asserts req is Request & { user: AuthUser } {
  if (!req.user) {
    throw new Error('User required');
  }
}

// Nutzung:
function myController(req: Request, res: Response) {
  requiresUser(req);
  // TypeScript weiß jetzt dass req.user existiert (kein ! nötig)
  const userId = req.user.userId;
}
```

## 9. Debugging

### Logs einschalten

```typescript
// In src/middleware/cognitoAuth.ts sind bereits console.logs
// Output in CloudWatch Logs:

[Cognito] User eingeloggt: test@example.com (customer)
[Cognito] Kein Request Context - kein Cognito Token
[Cognito] Keine Authorizer Claims - User nicht eingeloggt
```

### Request Context inspizieren

```typescript
router.get('/debug/context', (req, res) => {
  const event = (req as any).apiGateway?.event;

  res.json({
    hasEvent: !!event,
    hasUser: !!req.user,
    user: req.user,
    requestContext: event?.requestContext,
    authorizerClaims: event?.requestContext?.authorizer?.claims
  });
});
```

## 10. Best Practices

### ✅ DO

```typescript
// Middleware in richtiger Reihenfolge
app.use(cors());
app.use(express.json());
app.use(attachCognitoUser);  // NACH json parser
app.use('/api', routes);

// Explizite Middleware für geschützte Routes
router.post('/cart', requireAuth, handler);

// User ID aus req.user nutzen (NICHT aus req.body!)
const userId = req.user!.userId;
```

### ❌ DON'T

```typescript
// User ID aus Request Body vertrauen (UNSICHER!)
const userId = req.body.userId;  // ❌ User könnte andere ID schicken!

// req.user ohne Null-Check
const email = req.user.email;  // ❌ Kann undefined sein!

// Middleware in falscher Reihenfolge
app.use('/api', routes);
app.use(attachCognitoUser);  // ❌ Zu spät!
```

## Nächste Schritte

1. ✅ `attachCognitoUser` in `index.ts` einbinden
2. ✅ Routes mit `requireAuth` / `requireAdmin` schützen
3. ✅ Alte JWT Middleware entfernen
4. ✅ Testen mit echten Cognito Tokens
5. ✅ Frontend Integration (Sign Up / Login UI)

Siehe auch:
- [Frontend Integration Guide](../frontend/COGNITO_FRONTEND.md)
- [Testing Guide](./TESTING.md)
