# 🔐 Cognito Terraform Module

**Einfaches Cognito User Pool Setup für Ecokart**

## Was macht dieses Modul?

Erstellt AWS Cognito Resources für User-Authentifizierung:
- ✅ Cognito User Pool (User-Datenbank)
- ✅ User Pool Client (für Frontend)
- ✅ Email Verification
- ✅ Password Policy
- ✅ Custom Attribute "role" (admin/customer)

## Nutzung

```hcl
# In deinem main.tf
module "cognito" {
  source = "./modules/cognito"

  project_name = "ecokart"
  environment  = "development"
}

# Outputs nutzen
output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}
```

## Outputs

| Output | Beschreibung | Beispiel |
|--------|--------------|----------|
| `user_pool_id` | ID des User Pools | `eu-north-1_AbCdEfG` |
| `user_pool_arn` | ARN des User Pools | `arn:aws:cognito-idp:...` |
| `user_pool_client_id` | Client ID für Frontend | `1a2b3c4d5e6f7g8h9i0j` |
| `frontend_env_vars` | Fertige .env Werte | Kopieren in .env.local |

## Frontend Integration

Nach `terraform apply`:

1. **Outputs kopieren:**
```bash
terraform output frontend_env_vars
```

2. **In Frontend .env.local einfügen:**
```bash
cd frontend
# Outputs hier einfügen
```

3. **Amplify installieren:**
```bash
npm install aws-amplify @aws-amplify/ui-react
```

4. **Amplify konfigurieren:**
```typescript
// frontend/app/lib/amplify.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      region: 'eu-north-1'
    }
  }
});
```

## Features

### Email als Username
✅ User muss sich nur Email merken (kein separater Username)

### Password Policy
- Minimum 8 Zeichen
- Muss Groß- und Kleinbuchstaben haben
- Muss Zahlen haben
- Symbole optional

### Email Verification
- Automatischer Code per Email
- User muss Email bestätigen vor Login

### Custom Attributes
- `role`: "admin" oder "customer"
- Kann später erweitert werden

### Token Validity
- ID Token: 60 Minuten
- Access Token: 60 Minuten
- Refresh Token: 7 Tage

## Testing

### Sign Up Testen
```bash
# AWS CLI
aws cognito-idp sign-up \
  --client-id YOUR_CLIENT_ID \
  --username test@example.com \
  --password "Test1234!"

# Verification Code (kommt per Email)
aws cognito-idp confirm-sign-up \
  --client-id YOUR_CLIENT_ID \
  --username test@example.com \
  --confirmation-code 123456
```

### Login Testen
```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id YOUR_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD="Test1234!"
```

## Kosten

**FREE Tier:**
- Erste 50.000 MAU (Monthly Active Users): FREE
- Emails: 50/Tag via Cognito DEFAULT
- Darüber: $0.0055 pro MAU

**Für unser Projekt:** FREE (weit unter Limit)

## Variables

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `project_name` | - | **REQUIRED** - Projekt-Name |
| `environment` | - | **REQUIRED** - development/staging/production |
| `mfa_configuration` | OFF | MFA (OFF/OPTIONAL/ON) |
| `password_minimum_length` | 8 | Min. Password-Länge |
| `password_require_symbols` | false | Symbole Pflicht? |

## Nächste Schritte

Nach Deployment:

1. **API Gateway Authorizer** konfigurieren
2. **Frontend** Integration (Sign Up/Login UI)
3. **Backend** anpassen (User aus Cognito Context)
4. **Testing** (kompletter Auth Flow)

Siehe: `docs/guides/COGNITO_IMPLEMENTATION.md`

## Support

Bei Fragen:
- AWS Cognito Docs: https://docs.aws.amazon.com/cognito/
- Amplify Auth: https://docs.amplify.aws/javascript/build-a-backend/auth/
