# GitHub Actions IAM Role Module

Terraform-Modul zur Verwaltung der IAM Role für GitHub Actions OIDC-basierte Deployments.

## Features

- ✅ IAM Role mit Trust Policy für GitHub OIDC Provider
- ✅ 10 Managed Policies für alle AWS Services
- ✅ **NEU:** Terraform S3 Backend + DynamoDB State Locking Policy
- ✅ **NEU:** Cognito User Pool Management Policy
- ✅ Automatisches Tagging

## Policies

| Policy | Services | Purpose |
|--------|----------|---------|
| **amplify** | AWS Amplify | Frontend Hosting Management |
| **apigateway** | API Gateway | API Management |
| **cloudwatch** | CloudWatch Logs | Logging |
| **dynamodb** | DynamoDB | Database Management |
| **iam** | IAM | Role/Policy Management für Lambda |
| **lambda** | Lambda | Backend API Management |
| **s3** | S3 | Lambda Code Deployment |
| **ssm** | SSM Parameter Store | Secrets Management |
| **terraform-backend** | S3 + DynamoDB | **NEU:** Terraform State Backend |
| **cognito** | Cognito | **NEU:** User Pool Management |

## Usage

```hcl
module "github_actions_role" {
  source = "./modules/github-actions-role"

  role_name    = "ecokart-github-actions-role"
  github_repo  = "AndySchlegel/Ecokart-Webshop"
  aws_region   = "eu-north-1"

  tags = {
    Project     = "ecokart"
    Environment = "development"
    ManagedBy   = "Terraform"
  }
}
```

## Inputs

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `role_name` | Name of IAM role | string | Yes |
| `github_repo` | GitHub repo (owner/repo) | string | Yes |
| `aws_region` | AWS region | string | Yes |
| `tags` | Tags for all resources | map(string) | No |

## Outputs

| Name | Description |
|------|-------------|
| `role_arn` | ARN of the IAM role |
| `role_name` | Name of the IAM role |
| `policy_arns` | ARNs of all attached policies |

## Import Existing Resources

Falls die Role bereits manuell erstellt wurde:

```bash
cd terraform/examples/basic

# Import Role
terraform import module.ecokart.module.github_actions_role.aws_iam_role.github_actions ecokart-github-actions-role

# Import Policies
terraform import module.ecokart.module.github_actions_role.aws_iam_policy.amplify arn:aws:iam::ACCOUNT_ID:policy/ecokart-github-actions-role-amplify

# ... (siehe IMPORT_IAM_ROLE.md für alle Befehle)
```

## Terraform S3 Backend Policy

Die neue `terraform-backend` Policy ermöglicht:

### S3 Permissions
- ✅ Create Bucket
- ✅ List/Get/Put/Delete Objects
- ✅ Manage Versioning
- ✅ Manage Encryption
- ✅ Manage Public Access Block

### DynamoDB Permissions
- ✅ Create Table
- ✅ Describe Table
- ✅ State Locking (Get/Put/Delete Item)

**Resource Pattern:**
- S3: `ecokart-terraform-state-*`
- DynamoDB: `ecokart-terraform-state-lock`

## Security

- OIDC-basierte Authentifizierung (keine AWS Keys!)
- Trust Policy beschränkt auf spezifisches GitHub Repository
- Session Duration: 1 Stunde
- Alle Ressourcen mit Tags versehen

## Maintenance

### Neue Policy hinzufügen

1. In `policies.tf`:
```hcl
resource "aws_iam_policy" "new_service" {
  name = "${var.role_name}-new-service"
  policy = jsonencode({...})
}

resource "aws_iam_role_policy_attachment" "new_service" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.new_service.arn
}
```

2. In `outputs.tf`:
```hcl
output "policy_arns" {
  value = {
    ...
    new_service = aws_iam_policy.new_service.arn
  }
}
```

### Policy aktualisieren

Einfach in `policies.tf` ändern und `terraform apply` ausführen.
