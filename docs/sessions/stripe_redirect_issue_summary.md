# Stripe Redirect Issue - Comprehensive Summary for Claude Code

## 🔴 THE PROBLEM

After completing Stripe checkout payment, users are redirected to `http://localhost:3000/checkout/success` instead of the deployed Amplify URL (e.g., `https://develop.d123abc.amplifyapp.com/checkout/success`).

**Impact**: Critical - users cannot complete checkout flow in production.

**Iterations attempted**: 180+ over multiple days with multiple AI assistants.

---

## 🏗️ ARCHITECTURE OVERVIEW

```
Frontend (Next.js on Amplify)
  ↓ POST /api/checkout
API Gateway (CORS enabled)
  ↓ Lambda Proxy Integration
Lambda (Express.js Backend)
  ↓ Creates Stripe Session with success_url
Stripe Checkout
  ↓ Redirects after payment
User → success_url (SHOULD be Amplify URL, IS localhost)
```

**Key Files**:
- Backend: `backend/src/controllers/checkoutController.ts` (creates Stripe session)
- Frontend: `frontend/app/checkout/page.tsx` (calls backend)
- Infrastructure: `terraform/main.tf` (Lambda env vars)
- CORS: `backend/src/index.ts` (CORS configuration)

---

## ❌ ATTEMPTED SOLUTIONS THAT FAILED

### 1. Custom Header `X-Frontend-URL` ❌
**Approach**: Frontend sends custom header with Amplify URL
```typescript
headers: {
  'X-Frontend-URL': window.location.origin
}
```
**Why it failed**: CORS preflight rejection
```
Request header field X-Frontend-URL is not allowed by Access-Control-Allow-Headers
```
**Lesson**: Custom headers require explicit CORS `Access-Control-Allow-Headers` configuration.

---

### 2. Request Body `frontendUrl` ❌
**Approach**: Send URL in POST body
```typescript
body: JSON.stringify({
  shippingAddress,
  frontendUrl: window.location.origin
})
```
**Why it failed**: Backend code was inconsistently reading this value; sometimes it worked locally but not in production. Unclear if the value was actually sent or if backend parsing failed.

---

### 3. Origin Header Detection ❌
**Approach**: Use standard `Origin` header (automatically sent by browser)
```typescript
const origin = req.headers.origin || FRONTEND_URL;
```
**Why it failed**: Unclear - Origin header SHOULD be present in CORS requests, but either:
- API Gateway filtered it out
- Lambda didn't receive it correctly
- Code logic had a bug
**Status**: Never got definitive proof from CloudWatch logs that Origin header was/wasn't present.

---

### 4. Terraform Dynamic FRONTEND_URL ❌
**Approach**: Set Lambda env var `FRONTEND_URL` dynamically from Amplify output
```terraform
FRONTEND_URL = var.enable_amplify ? module.amplify[0].branch_url : "http://localhost:3000"
```
**Why it failed**: **Circular Dependency**
```
Error: Cycle: module.lambda, module.amplify
```
- Lambda needs Amplify output (data dependency)
- Amplify has `depends_on = [module.lambda]` (explicit dependency)
- Terraform cannot resolve circular references

---

### 5. Multiple URL Source Fallback Chain ❌
**Approach**: Try multiple sources in priority order
```typescript
const urlSources = [
  { name: 'frontendUrl (request body)', url: frontendUrl },
  { name: 'x-frontend-url (header)', url: frontendUrlHeader },
  { name: 'origin (header)', url: requestOrigin },
  { name: 'derived host URL', url: derivedHostUrl },
  { name: 'FRONTEND_URL (env var)', url: FRONTEND_URL },
];
const selectedSource = urlSources.find(source => source.url?.startsWith('http'));
```
**Why it failed**: All sources failed or returned localhost, falling back to `FRONTEND_URL=localhost`. Debug logs never showed which source was selected (suggesting code wasn't even running or logs weren't reaching CloudWatch).

---

### 6. Product Images Removal ✅ (Partial Success)
**Approach**: Remove product images from Stripe line items
```typescript
product_data: {
  name: item.name,
  // images removed - caused "Not a valid URL" error
}
```
**Result**: Fixed Stripe validation error, but didn't solve redirect issue.

---

## 🔍 ROOT CAUSE ANALYSIS (Suspected but Unconfirmed)

### Theory 1: API Gateway Header Filtering
**Hypothesis**: API Gateway integration strips necessary headers before reaching Lambda.
**Evidence**: 
- CORS errors for custom headers
- Origin header never appeared in logs
**Unconfirmed**: Never saw raw Lambda `event` object to verify what headers actually arrive.

### Theory 2: Lambda Deployment Issue
**Hypothesis**: New code never actually deployed to Lambda despite successful Terraform/GitHub Actions.
**Evidence**: 
- Debug logs didn't appear in CloudWatch
- `lambda get-function LastModified` showed updates, but logs didn't reflect code changes
**Unconfirmed**: Never definitively proved code mismatch.

### Theory 3: CORS Configuration Gap
**Hypothesis**: CORS config in `backend/src/index.ts` incomplete for deployed domain.
**Current CORS**:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    /https:\/\/.*\.amplifyapp\.com$/  // Should match Amplify
  ],
  credentials: true
}));
```
**Unconfirmed**: Regex should match Amplify URLs, but never verified in AWS logs.

### Theory 4: Lambda Environment Variable Caching
**Hypothesis**: Lambda container caches old `FRONTEND_URL=localhost` value.
**Evidence**: Weak - Lambda should pick up new env vars on next cold start.
**Unconfirmed**: Never forced full Lambda teardown/recreation.

---

## 🚫 DO NOT REPEAT THESE APPROACHES

1. **DO NOT** try custom headers without first verifying CORS `Access-Control-Allow-Headers` explicitly allows them
2. **DO NOT** try Terraform `module.amplify[0].branch_url` in Lambda env vars (causes circular dependency)
3. **DO NOT** rely on Origin header without **first verifying** it arrives at Lambda (add debug log for `req.headers`)
4. **DO NOT** assume Terraform/GitHub Actions deployment works - verify Lambda code update via logs
5. **DO NOT** add more fallback URL sources - the problem is none of them work, not that we need more

---

## ✅ WHAT WORKED (Partially)

1. **Stripe Session Creation**: Backend successfully creates sessions (logs confirm `"Checkout session created"`)
2. **CORS for Standard Calls**: Frontend can call backend API successfully
3. **Image Removal**: Fixed Stripe product image validation error
4. **Lambda Execution**: Lambda runs without errors (except redirect URL issue)

---

## 🎯 RECOMMENDED NEXT STEPS (Untried)

### Option 1: SSM Parameter Store (Cleanest)
**Concept**: Decouple Amplify URL from Lambda deployment

1. **Amplify Post-Deploy Hook**: After Amplify builds, write URL to SSM Parameter
   ```bash
   # In Amplify build settings (amplify.yml)
   aws ssm put-parameter --name /ecokart/development/frontend-url \
     --value "https://${AWS_BRANCH}.${AWS_APP_ID}.amplifyapp.com" \
     --overwrite
   ```

2. **Lambda Reads from SSM at Runtime**:
   ```typescript
   import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
   
   let cachedFrontendUrl: string | null = null;
   
   async function getFrontendUrl(): Promise<string> {
     if (cachedFrontendUrl) return cachedFrontendUrl;
     
     const ssm = new SSMClient({ region: process.env.AWS_REGION });
     const param = await ssm.send(new GetParameterCommand({
       Name: `/ecokart/${process.env.ENVIRONMENT}/frontend-url`
     }));
     
     cachedFrontendUrl = param.Parameter?.Value || 'http://localhost:3000';
     return cachedFrontendUrl;
   }
   
   // In checkout controller:
   const frontendUrl = await getFrontendUrl();
   ```

3. **Lambda IAM Permissions**: Add SSM read permission
   ```terraform
   # terraform/modules/lambda/main.tf
   statement {
     actions   = ["ssm:GetParameter"]
     resources = ["arn:aws:ssm:*:*:parameter/ecokart/*"]
   }
   ```

**Pros**: 
- No circular dependency
- Fully automated
- Works across environments

**Cons**: 
- Adds SSM dependency
- Slight latency on first call (cached after)

---

### Option 2: API Gateway Custom Domain Name
**Concept**: Use same domain for frontend and backend, eliminate CORS entirely

- Amplify: `https://shop.example.com`
- API Gateway: `https://shop.example.com/api`

**Setup**:
1. Custom domain in Route53
2. CloudFront in front of Amplify
3. API Gateway custom domain mapping
4. Origin routing rules

**Pros**: No CORS issues, no URL detection needed
**Cons**: Complex setup, requires custom domain

---

### Option 3: Hardcode Per Environment (Temporary Workaround)
**Concept**: Manual FRONTEND_URL in Terraform tfvars

```hcl
# terraform/environments/development.tfvars
frontend_url = "https://develop.d1d14e6pdoz4r.amplifyapp.com"  # MANUAL!

# terraform/environments/production.tfvars  
frontend_url = "https://main.d1d14e6pdoz4r.amplifyapp.com"     # MANUAL!
```

**Pros**: Simple, no code changes
**Cons**: 
- Manual update required when Amplify URL changes
- Breaks reproducibility
- NOT suitable for multi-account deployment

---

### Option 4: Stripe Dashboard Redirect URLs
**Concept**: Configure URLs directly in Stripe Dashboard instead of programmatically

**Stripe Dashboard**: Settings → Checkout → Redirect URLs
- Success URL: `https://develop.d123.amplifyapp.com/checkout/success`
- Cancel URL: `https://develop.d123.amplifyapp.com/checkout/cancel`

**Backend Change**:
```typescript
const session = await stripe.checkout.sessions.create({
  line_items: lineItems,
  mode: 'payment',
  // REMOVE success_url and cancel_url - let Stripe Dashboard handle it
  metadata: { userId, cartId, shippingAddress: JSON.stringify(shippingAddress) }
});
```

**Pros**: 
- Completely bypasses backend URL detection
- No code changes needed
- Immediate fix

**Cons**: 
- Manual configuration per environment
- Less flexible (can't have dynamic URLs per user/session)

---

## 🔬 CRITICAL DEBUGGING STEPS (Do First!)

Before trying new solutions, get DEFINITIVE ANSWERS:

### 1. Verify What Lambda Receives
```typescript
// In checkoutController.ts - FIRST LINE of handler
export const createCheckoutSession = async (req: Request, res: Response) => {
  console.log('🔍 RAW EVENT HEADERS:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 ENVIRONMENT VARS:', {
    FRONTEND_URL: process.env.FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV
  });
  
  // Rest of handler...
};
```

**Deploy this and check CloudWatch logs - THIS IS NON-NEGOTIABLE.**

You MUST see:
- What headers arrive (origin, referer, host, etc.)
- What `FRONTEND_URL` env var contains

Without this data, you're flying blind.

---

### 2. Verify Lambda Code is Actually Updated
```typescript
// Add a UUID to checkoutController.ts
const DEPLOYMENT_ID = 'v2025-12-01-15-00-CHANGE-THIS';

logger.info('Checkout controller loaded', { DEPLOYMENT_ID });
```

Change the UUID on each deploy. If you don't see the new UUID in logs, **code isn't deploying**.

---

### 3. Verify Stripe Session URL
```typescript
// After creating session
logger.info('Stripe session created', {
  sessionId: session.id,
  success_url: session.success_url,  // ← LOG THIS!
  cancel_url: session.cancel_url,
  amount: session.amount_total
});
```

This shows what URL **Stripe actually stored**, not what we think we sent.

---

## 📊 CURRENT STATE

**Files modified** (potentially out of sync):
- `backend/src/controllers/checkoutController.ts` - multiple conflicting changes
- `frontend/app/checkout/page.tsx` - removed custom header
- `terraform/main.tf` - reverted circular dependency

**Deployed status**: Unknown - unclear if latest code is running in Lambda

**Next session should start with**: Full audit of what's actually deployed vs. what's in git.

---

## 🎓 LESSONS LEARNED

1. **Headers in Lambda behind API Gateway are unreliable** - need explicit verification
2. **Terraform module circular dependencies are hard blockers** - must use alternative patterns
3. **CloudWatch logs are essential** - without them, impossible to debug
4. **Deployment verification is critical** - "successful deploy" doesn't mean code is running
5. **CORS is strict** - custom headers need explicit allowlist

---

## 💡 RECOMMENDATION FOR CLAUDE CODE

**Start with Option 4 (Stripe Dashboard) as immediate workaround**, then implement Option 1 (SSM Parameter Store) as long-term solution.

**Critical first step**: Add comprehensive logging (Debug Step 1-3 above) and verify what Lambda actually receives. Without this data, any solution is guesswork.

**DO NOT**: Try custom headers, Origin detection, or Terraform dynamic vars - all proven to fail.
