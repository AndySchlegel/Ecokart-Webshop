# 📝 Structured Logging Migration Guide

**Date:** 2025-11-24
**Status:** IN PROGRESS (Core infrastructure complete, migration ongoing)

## 🎯 Goal

Migrate from raw `console.log`/`console.error` statements to structured logging with CloudWatch integration for better observability, debugging, and production monitoring.

---

## ✅ Completed

### 1. Logger Infrastructure (100% Complete)

**Created structured logger utilities:**
- ✅ `backend/src/utils/logger.ts` - Backend logger with CloudWatch integration
- ✅ `frontend/lib/logger.ts` - Frontend logger for browser environment
- ✅ `admin-frontend/lib/logger.ts` - Admin dashboard logger

**Features implemented:**
- Log levels: DEBUG, INFO, WARN, ERROR
- Structured JSON logging for CloudWatch (production)
- Human-readable colored output (development)
- Contextual metadata support (userId, requestId, path, etc.)
- Child logger support for request-scoped logging
- Automatic error stack trace capture
- Production-ready error tracking preparation

### 2. Backend Migration (Partial - Core files done)

**Completed files:**
- ✅ `backend/src/index.ts` - Server startup & HTTP request logging
- ✅ `backend/src/controllers/productController.ts` - All product operations
- ✅ `backend/src/controllers/cartController.ts` - All cart operations

**Migration pattern used:**
```typescript
// OLD
console.error('Error fetching products:', error);

// NEW
import { logger } from '../utils/logger';
logger.error('Failed to fetch products', { action: 'getAllProducts' }, error as Error);
```

**Benefits:**
- Structured log entries with timestamp, level, message, context
- CloudWatch Logs Insights queries possible
- Automatic error details capture (message, stack, custom properties)
- Request duration tracking in HTTP middleware

---

## 🚧 Remaining Work

### Backend Files (Still using console.*)

**Priority 1 - Controllers:**
- `backend/src/controllers/orderController.ts` (4 console.error statements)

**Priority 2 - Middleware:**
- `backend/src/middleware/cognitoJwtAuth.ts` (Heavy debugging, ~25 console statements)
- `backend/src/middleware/cognitoAuth.ts` (~6 console statements)

**Priority 3 - Configuration:**
- `backend/src/config/database.ts` (2 console.error statements)
- `backend/src/config/database-adapter.ts` (1 console.log statement)

**Priority 4 - Tests:**
- `backend/src/middleware/__tests__/cognitoJwtAuth.test.ts` (Comments about suppressing console, OK to keep)

### Frontend Files (Still using console.*)

**Customer Frontend:**
- `frontend/lib/amplify.ts` (Heavy debug logging, ~30 statements)
- `frontend/contexts/AuthContext.tsx` (~15 statements)
- `frontend/contexts/CartContext.tsx` (5 error statements)
- `frontend/components/Navigation.tsx` (1 error statement)
- `frontend/app/verify-email/page.tsx` (~10 log statements)
- `frontend/app/error.tsx` (Error boundary - 1 statement)
- `frontend/app/global-error.tsx` (Global error - 1 statement)
- `frontend/app/checkout/error.tsx` (Checkout error - 1 statement)

**Admin Frontend:**
- `admin-frontend/lib/auth.ts` (1 error statement)
- `admin-frontend/lib/articles.ts` (1 log statement)
- `admin-frontend/app/api/login/route.ts` (~10 log statements)
- `admin-frontend/app/api/articles/route.ts` (~5 log statements)
- `admin-frontend/app/error.tsx` (Error boundary - 1 statement)
- `admin-frontend/app/global-error.tsx` (Global error - 1 statement)

---

## 📖 Migration Instructions

### Step 1: Import the Logger

Add at the top of the file:

```typescript
// Backend
import { logger } from '../utils/logger';  // or '../../utils/logger' depending on depth

// Frontend
import { logger } from '@/lib/logger';
```

### Step 2: Replace console statements

**Pattern A: Simple error logging**
```typescript
// Before
console.error('Database error:', error);

// After
logger.error('Database operation failed', { action: 'readData' }, error as Error);
```

**Pattern B: Info/Debug logging**
```typescript
// Before
console.log('User logged in:', userData.email);

// After
logger.info('User logged in', { userId: userData.id, email: userData.email });
```

**Pattern C: Warning logging**
```typescript
// Before
console.warn('⚠️ Cognito not configured');

// After
logger.warn('Cognito not configured', { component: 'amplify-setup' });
```

**Pattern D: Debug logging (development only)**
```typescript
// Before
console.log('🔍 DEBUG: Token validation', { token: token.substring(0, 20) });

// After
logger.debug('Token validation', { tokenPreview: token.substring(0, 20) });
```

### Step 3: Add contextual metadata

Always include relevant context:
- `userId` - Current user ID
- `email` - User email
- `action` - What operation was being performed
- `path` - API path or route
- `productId`, `orderId`, etc. - Resource identifiers
- `component` - Component or module name

```typescript
logger.error('Failed to update order', {
  action: 'updateOrderStatus',
  orderId: req.params.id,
  userId: req.user?.userId,
  newStatus: req.body.status
}, error as Error);
```

### Step 4: Use child loggers for request-scoped logging

For middleware or request handlers:
```typescript
const requestLogger = logger.child({
  requestId: req.id,
  userId: req.user?.userId,
  path: req.path
});

requestLogger.info('Processing request');
requestLogger.error('Request failed', {}, error as Error);
```

---

## 🔍 CloudWatch Logs Insights Queries

Once fully migrated, use these queries in AWS CloudWatch Logs Insights:

**Find all errors:**
```
fields @timestamp, message, context.error, context.userId
| filter level = "ERROR"
| sort @timestamp desc
```

**Find slow requests (>1000ms):**
```
fields @timestamp, message, context.path, context.duration
| filter context.duration > 1000
| sort context.duration desc
```

**Track specific user activity:**
```
fields @timestamp, message, context.userId, context.path
| filter context.userId = "specific-user-id"
| sort @timestamp asc
```

**API endpoint performance:**
```
stats avg(context.duration), max(context.duration), count(*) by context.path
| sort avg(context.duration) desc
```

---

## 💡 Best Practices

### DO:
✅ Use structured logging with context
✅ Include userId/email when available
✅ Add action/component context
✅ Use appropriate log levels (DEBUG for dev, INFO for production events, ERROR for failures)
✅ Pass Error objects as third parameter for automatic stack trace capture
✅ Use child loggers for scoped contexts

### DON'T:
❌ Log sensitive data (passwords, full tokens, credit cards)
❌ Over-log in hot paths (use DEBUG level for verbose logging)
❌ Use console.* directly (use logger instead)
❌ Log without context (always add metadata)
❌ Mix old and new logging patterns (migrate files completely)

---

## 🚀 Next Steps

1. **Continue Backend Migration:**
   - Start with `orderController.ts` (similar pattern to product/cart controllers)
   - Then tackle middleware files (cognitoJwtAuth.ts has heavy logging)
   - Finish with config files

2. **Frontend Migration:**
   - Start with error boundaries (simple, already have logger imported)
   - Then Context files (AuthContext, CartContext)
   - Finish with lib files (amplify.ts has extensive debug logging)

3. **Admin Frontend Migration:**
   - Similar pattern to customer frontend
   - Focus on API routes first
   - Then lib and error boundaries

4. **Testing:**
   - Run backend locally, verify logs appear correctly
   - Check development vs production formatting
   - Deploy to AWS, verify CloudWatch Logs capture

5. **Documentation:**
   - Update README with logging best practices
   - Add CloudWatch Logs Insights query examples
   - Document log levels and when to use them

---

## 📊 Progress Tracking

**Overall Progress:** ~20% complete

- **Backend:** 30% (3/10 files)
- **Frontend Customer:** 10% (0/9 files, logger created)
- **Frontend Admin:** 10% (0/7 files, logger created)

**Estimated Time Remaining:** 2-3 hours for complete migration

---

## 🔗 Related Files

- `backend/src/utils/logger.ts` - Backend logger implementation
- `frontend/lib/logger.ts` - Frontend logger implementation
- `admin-frontend/lib/logger.ts` - Admin frontend logger implementation
- `.claude/LOGGING_MIGRATION_GUIDE.md` - This file

---

## 📝 Notes

- The logger automatically detects NODE_ENV and adjusts output format
- In development: colored, human-readable console output
- In production: JSON-formatted for CloudWatch parsing
- Error objects are automatically expanded (message, stack, custom properties)
- Child loggers inherit parent context and merge with additional context
- Console.* statements in ASCII art (like server startup banner) can remain as-is with `/* eslint-disable no-console */` comments
