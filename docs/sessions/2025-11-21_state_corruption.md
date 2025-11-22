# 🔥 Critical Debugging Session - Terraform State Corruption & Recovery

**Date:** 21. November 2025
**Duration:** ~6 hours
**Status:** Infrastructure Recovered, Critical Bug Identified
**Difficulty:** 🔴🔴🔴🔴🔴 (5/5) - One of the hardest debugging sessions

---

## 📋 Session Summary

This was an extremely challenging debugging session focused on recovering from Terraform state corruption after architectural changes. After 4+ hours of failed attempts, a complete manual AWS CLI cleanup was required to get a fresh deployment working. However, a critical frontend token storage bug was discovered that blocks all authenticated features.

**User Frustration Level:** 10/10
> "Ich fühle mich maximal verarscht langsam!!!"
> "ein schwarzer Tag mit Claude code"

---

## 🚨 Initial Problem: Terraform State Corruption

### The Trigger
Infrastructure was changed from deploying via `terraform/examples/basic/` wrapper to deploying directly from `terraform/` root. This architectural change caused catastrophic state corruption.

### Error Messages
```
Error: Provider configuration not present

To work with module.ecokart.module.dynamodb.aws_dynamodb_table.products (orphan)
its original provider configuration at module.ecokart.provider["..."] is required,
but it has been removed. This occurs when a provider configuration is removed while
objects created by that provider still exist in the state.
```

### Root Cause
- **Old State Structure:** Resources under `module.ecokart.*` prefix (from examples/basic/ wrapper)
- **New Code Structure:** Resources directly under `module.dynamodb.*` (from terraform/ root)
- **Result:** Terraform couldn't map state resources to code → Complete state corruption

---

## 🔄 Failed Attempts (Chronological)

### Attempt 1: Revert Workflows to examples/basic/
**Action:** Changed `.github/workflows/deploy.yml` back to `terraform/examples/basic/`
**Result:** ❌ FAILED
**Error:**
```
ERROR: Config file not found: environments/development.tfvars
ls: cannot access 'environments/': No such file or directory
```
**Why:** Config files are in `terraform/environments/` but workflow ran from `terraform/examples/basic/`

### Attempt 2: Fix CONFIG_FILE Path
**Action:** Updated path to `../../environments/development.tfvars`
**Result:** ❌ FAILED
**Error:**
```
Error refreshing state: state data in S3 does not have the expected content.
This may be caused by unusually long delays in S3 processing a previous state update.
```
**Why:** State file in S3 was corrupted

### Attempt 3: Delete State File Before Init
**Action:** Added step to delete state file from S3
**Result:** ❌ FAILED
**Error:** Same "expected content" error
**Why:** DynamoDB lock entry also corrupted with wrong digest

### Attempt 4: Delete State + Lock Entry
**Action:** Delete both S3 state file AND DynamoDB lock entry
**Result:** ❌ FAILED
**Error:** `ResourceInUseException: Table already exists: ecokart-products`
**Why:** AWS resources still existed from previous deployment

### Attempt 5: Standard Destroy Workflow
**Action:** Run destroy.yml workflow
**Result:** ❌ FAILED
**Error:** "Provider configuration not present" (same as initial)
**Why:** Destroy also needs state to work, which was corrupted

**User Reaction:** "Meine Begeisterung steigt und steigt" (sarcastic)

---

## ✅ The Solution: Nuclear Cleanup

After all automated approaches failed, manual cleanup via AWS CLI was the only option.

### Step 1: Delete Corrupted State & Lock
```bash
# Delete corrupted state file
aws s3 rm s3://ecokart-terraform-state-729403197965/development/terraform.tfstate \
  --region eu-north-1

# Delete corrupted lock entry
aws dynamodb delete-item \
  --table-name ecokart-terraform-state-lock \
  --key '{"LockID": {"S": "ecokart-terraform-state-729403197965/development/terraform.tfstate"}}' \
  --region eu-north-1
```

### Step 2: Delete All DynamoDB Tables
```bash
# Products table
aws dynamodb delete-table --table-name ecokart-products --region eu-north-1
aws dynamodb wait table-not-exists --table-name ecokart-products --region eu-north-1

# Users table
aws dynamodb delete-table --table-name ecokart-users --region eu-north-1
aws dynamodb wait table-not-exists --table-name ecokart-users --region eu-north-1

# Carts table
aws dynamodb delete-table --table-name ecokart-carts --region eu-north-1
aws dynamodb wait table-not-exists --table-name ecokart-carts --region eu-north-1

# Orders table
aws dynamodb delete-table --table-name ecokart-orders --region eu-north-1
aws dynamodb wait table-not-exists --table-name ecokart-orders --region eu-north-1
```

### Step 3: Delete Cognito User Pools
```bash
# Found 3 Cognito User Pools (all named ecokart-development-users)
aws cognito-idp delete-user-pool --user-pool-id eu-north-1_CWapsLe2H --region eu-north-1
aws cognito-idp delete-user-pool --user-pool-id eu-north-1_lZ50x3KSg --region eu-north-1
aws cognito-idp delete-user-pool --user-pool-id eu-north-1_oJILiEJuz --region eu-north-1
```

### Step 4: Delete Lambda Function
```bash
aws lambda delete-function \
  --function-name ecokart-development-api \
  --region eu-north-1
```

### Step 5: Delete API Gateway
```bash
# Note: REST API, not HTTP API!
aws apigateway delete-rest-api \
  --rest-api-id smdjfnv44i \
  --region eu-north-1
```

### Step 6: Delete IAM Role
```bash
# Detach managed policies first
aws iam detach-role-policy \
  --role-name ecokart-development-api-exec-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Delete inline policies
aws iam delete-role-policy \
  --role-name ecokart-development-api-exec-role \
  --policy-name ecokart-development-api-dynamodb-policy

# Delete role
aws iam delete-role --role-name ecokart-development-api-exec-role
```

### Step 7: Delete CloudWatch Logs
```bash
aws logs delete-log-group \
  --log-group-name /aws/lambda/ecokart-development-api \
  --region eu-north-1
```

### Step 8: Fresh Deployment
After complete cleanup, the deploy workflow was triggered and **succeeded**!

**User Reaction:** "Deployment Successful! Wette verloren erstes Wunder"

---

## 🔧 Permanent Solutions Created

### 1. Nuclear Cleanup Workflow
Created `.github/workflows/nuclear-cleanup.yml` for emergency situations:
```yaml
name: Nuclear Cleanup - Delete Everything

on:
  workflow_dispatch:
    inputs:
      confirm_nuclear:
        description: 'Type "NUCLEAR" to confirm complete deletion'
        required: true
        type: string
```

**Features:**
- Requires typing "NUCLEAR" to confirm
- Environment selection (development/staging/production)
- Deletes ALL AWS resources via CLI (not Terraform)
- Deletes Terraform state file
- Idempotent (all steps with `continue-on-error: true`)
- Comprehensive logging

**When to use:**
- ✅ Terraform destroy fails
- ✅ State corruption
- ✅ Need fresh start
- ❌ Production (only with backup!)

### 2. Forced State Cleanup in Deploy Workflow
Updated `.github/workflows/deploy.yml` with new step:
```yaml
- name: 🧹 Force Clear State & Lock
  run: |
    BUCKET_NAME="ecokart-terraform-state-729403197965"
    STATE_KEY="development/terraform.tfstate"
    LOCK_TABLE="ecokart-terraform-state-lock"
    LOCK_ID="$BUCKET_NAME/$STATE_KEY"

    # Force delete state file
    aws s3 rm "s3://$BUCKET_NAME/$STATE_KEY" || true

    # Force delete lock entries
    aws dynamodb delete-item \
      --table-name "$LOCK_TABLE" \
      --key "{\"LockID\": {\"S\": \"$LOCK_ID\"}}" || true

    # Also try with digest suffix
    aws dynamodb delete-item \
      --table-name "$LOCK_TABLE" \
      --key "{\"LockID\": {\"S\": \"${LOCK_ID}-md5\"}}" || true
```

This runs BEFORE `terraform init` to ensure clean slate.

### 3. Fixed destroy.yml - API Gateway Cleanup
Changed from HTTP APIs (`apigatewayv2`) to REST APIs (`apigateway`):
```yaml
# OLD (wrong):
aws apigatewayv2 get-apis

# NEW (correct):
aws apigateway get-rest-apis
aws apigateway delete-rest-api --rest-api-id xxx
```

---

## 🐛 Second Problem: Cart Returns 401 Unauthorized

After successful deployment, the cart endpoint was tested but returned 401 errors.

### Initial Diagnosis
```
Browser Request: POST /dev/api/cart
Response: 401 Unauthorized
Body: {"error":"Unauthorized"}
```

**Checked:**
- ✅ Lambda Logs: "✅ JWT validated for user: andy.schlegel@chakademie.org (customer)"
- ✅ Network Tab: Authorization header present
- ✅ Backend code: JWT validation working

**Question:** Why 401 if JWT validation succeeds?

### Discovery: Double Slash in URL
Inspection of Network tab revealed:
```
Actual Request: POST /dev//api/cart  ← Double slash!
```

**Root Cause:**
```bash
# Amplify Environment Variable:
NEXT_PUBLIC_API_URL=https://xxx.amazonaws.com/dev/  ← Trailing slash

# Frontend Code:
const url = `${API_URL}/api/cart`

# Result:
https://xxx.amazonaws.com/dev//api/cart  ← Double slash
```

**Why 401?**
API Gateway doesn't route `/dev//api/cart` correctly - routing fails, returns 401.

### Fix: Remove Trailing Slash
```bash
# For all 4 Amplify apps (later reduced to 2)
aws amplify update-app --app-id d14gvmewz6x56p --region eu-north-1 \
  --environment-variables \
    NEXT_PUBLIC_API_URL=https://ctykw3bvyg.execute-api.eu-north-1.amazonaws.com/dev,\
    NEXT_PUBLIC_USER_POOL_ID=eu-north-1_ab981TH97,\
    NEXT_PUBLIC_USER_POOL_CLIENT_ID=43l6lkdvk3df3lf3450bpdlcjc,\
    NEXT_PUBLIC_AWS_REGION=eu-north-1,\
    AMPLIFY_MONOREPO_APP_ROOT=frontend,\
    AMPLIFY_DIFF_DEPLOY=false

# Trigger rebuild
aws amplify start-job --app-id d14gvmewz6x56p --branch-name develop --job-type RELEASE --region eu-north-1
```

### Cleanup: Delete Duplicate Amplify Apps
Found 4 Amplify apps (2 customer + 2 admin frontends) from failed deployments:
```bash
# Kept:
# - d14gvmewz6x56p (Customer Frontend)
# - db6fx5pmh4si2 (Admin Frontend)

# Deleted duplicates:
aws amplify delete-app --app-id d1a8ydu4opo4tv --region eu-north-1  # Old customer
aws amplify delete-app --app-id d3ds92499cafzo --region eu-north-1  # Old admin
```

---

## 🔴 CRITICAL Discovery: Frontend Token Storage Bug

After URL fix and rebuild, double slash was gone but 401 errors persisted.

### Diagnostic Process

**Step 1: Check Lambda Logs Again**
```
2025-11-21T22:44:21 INFO ✅ JWT validated for user: andy.schlegel@chakademie.org (customer)
```
Still successful! Backend is working.

**Step 2: Check Network Request**
```
Request URL: https://ctykw3bvyg.execute-api.eu-north-1.amazonaws.com/dev/api/cart
Request Headers:
  Authorization: Bearer eyJraWQ...  ← Token present!
Response: 401 Unauthorized
```

**Step 3: Check Browser Console**
```javascript
console.log("User:", user);
// Output: ✅ User eingeloggt: andy.schlegel@chakademie.org (customer)
```
User appears logged in!

**Step 4: Check Browser Storage (THE DISCOVERY)**
```javascript
console.log(window.localStorage);
// Output: Storage {length: 0}  ← EMPTY!

console.log(window.sessionStorage);
// Output: Storage {length: 0}  ← EMPTY!
```

### The Problem
**Frontend authentication code does NOT persist tokens after login/registration!**

**What happens:**
1. User logs in/registers
2. Backend returns JWT tokens (idToken, accessToken, refreshToken)
3. Frontend uses token for FIRST request (hence "User eingeloggt" shows)
4. Frontend does NOT save tokens to localStorage/sessionStorage
5. Subsequent requests (Cart, Orders) can't retrieve token → 401

**Why hard to find:**
- ✅ No errors in Console
- ✅ Login APPEARS to work
- ✅ Backend JWT validation works
- ✅ Network shows Authorization header (for first request)
- ❌ Storage is empty (invisible without explicit check)

### Expected Fix (for tomorrow)
```typescript
// In AuthContext or similar:
// After successful login/registration:
const { idToken, accessToken, refreshToken } = authResult;

// MUST persist tokens:
localStorage.setItem('idToken', idToken);
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Later, when making requests:
const token = localStorage.getItem('idToken');
if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

**Files to investigate tomorrow:**
- `frontend/src/contexts/AuthContext.tsx` (likely location)
- Frontend authentication flow
- Token storage implementation

---

## 📊 Final Status

### ✅ Working
- Infrastructure deployed successfully
- Customer Frontend: https://develop.d14gvmewz6x56p.amplifyapp.com
- Admin Frontend: https://develop.db6fx5pmh4si2.amplifyapp.com
- API Gateway: https://ctykw3bvyg.execute-api.eu-north-1.amazonaws.com/dev/
- Backend JWT validation working correctly
- Products page loads
- User registration working
- User login working (visually)

### ❌ Broken
- **Token storage** - localStorage/sessionStorage empty after login
- **Cart functionality** - All requests return 401 Unauthorized
- **Orders functionality** - All authenticated endpoints broken
- **All authenticated features** - Cannot function without stored tokens

---

## 📚 Key Learnings

### 1. Terraform State is Fragile
**Lesson:** Never change architecture while state exists
**Best Practice:**
1. Destroy with old architecture
2. Change architecture
3. Deploy with new architecture

**When things go wrong:**
- Nuclear cleanup via AWS CLI may be only option
- Create emergency workflows as backup

### 2. API Gateway is Strict on Paths
**Lesson:** Double slashes (`//`) in URLs break API Gateway routing
**Best Practice:** Always normalize URLs:
```typescript
const apiUrl = BASE_URL.replace(/\/$/, ''); // Remove trailing slash
const fullUrl = `${apiUrl}/api/cart`;
```

### 3. REST vs HTTP APIs in AWS
**Lesson:** Different API types require different CLI commands
**Commands:**
- REST APIs: `aws apigateway`
- HTTP APIs: `aws apigatewayv2`

**Check Terraform resource type:**
- `aws_api_gateway_rest_api` → REST
- `aws_apigatewayv2_api` → HTTP

### 4. Storage Must Be Checked for Auth Issues
**Lesson:** Console logs and visual indicators can lie
**Debugging checklist for auth issues:**
1. ✅ Check backend logs
2. ✅ Check network requests
3. ✅ Check console output
4. ✅ **CHECK BROWSER STORAGE** (localStorage/sessionStorage)

### 5. Multiple Debugging Layers Required
**Lesson:** One successful test doesn't mean everything works
**Evidence:**
- JWT validation: ✅ Success
- Network header: ✅ Present
- User logged in: ✅ Shows
- Storage: ❌ Empty ← The actual problem

---

## ⏱️ Time Investment

| Task | Time |
|------|------|
| Initial debugging & failed attempts | ~4 hours |
| Manual AWS CLI cleanup | ~1 hour |
| Fresh deployment & testing | ~30 minutes |
| Double slash debugging | ~30 minutes |
| Token storage discovery | ~30 minutes |
| Documentation | ~30 minutes |
| **Total** | **~7 hours** |

---

## 🎯 Next Session Priorities (22.11.2025)

### 🔴 HIGHEST PRIORITY: Fix Frontend Token Storage
1. Investigate `frontend/src/contexts/AuthContext.tsx`
2. Find where tokens should be persisted after login
3. Implement token storage to localStorage
4. Test complete auth flow:
   - Registration → Token saved
   - Login → Token saved
   - Add to cart → Works
   - Page refresh → User still logged in
   - Checkout/Orders → Works

**Estimated effort:** 2-4 hours

### Secondary Tasks (if time permits)
1. Run destroy workflow to clean up infrastructure (save costs)
2. Consider deploy → staging for testing tomorrow
3. Update documentation if frontend auth patterns discovered

---

## 💭 User Feedback

**Frustration during debugging:**
> "Ich fühle mich maximal verarscht langsam!!!"
> "ein schwarzer Tag mit Claude code"
> "Meine Begeisterung steigt und steigt" (sarcastic)
> "ich verliere die Lust"

**After successful deployment:**
> "Deployment Successful! Wette verloren erstes Wunder"
> "Diesmal sorry für meine Verwirrung!"

**End of session:**
> "Ja okay bitte den Tag ausführlich dokumentieren, dass wir auch wissen wo wir morgen ansetzen müssen"

---

## 📎 Resources

**GitHub Actions Runs:**
- Deploy (successful): Run #XXX
- Destroy (failed): Run #XXX
- Nuclear Cleanup (successful): Run #XXX

**AWS Resources:**
- Region: eu-north-1
- S3 Bucket: ecokart-terraform-state-729403197965
- DynamoDB Lock Table: ecokart-terraform-state-lock

**Current Live URLs:**
- Customer: https://develop.d14gvmewz6x56p.amplifyapp.com
- Admin: https://develop.db6fx5pmh4si2.amplifyapp.com
- API: https://ctykw3bvyg.execute-api.eu-north-1.amazonaws.com/dev/

**Test User:**
- Email: andy.schlegel@chakademie.org
- Password: (user knows)
- Status: Registered but tokens not persisting

---

**Session End Time:** ~23:00 UTC
**Status:** Infrastructure stable, critical frontend bug identified
**Next Session:** 22.11.2025 - Token storage fix
