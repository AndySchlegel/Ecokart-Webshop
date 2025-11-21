# Import GitHub Actions IAM Role into Terraform

Die existierende `ecokart-github-actions-role` muss in Terraform importiert werden.

## Vorbereitung

```bash
cd terraform/examples/basic
terraform init
```

## Import Commands

**WICHTIG:** Diese Befehle müssen nur EINMAL ausgeführt werden!

```bash
# 1. Import IAM Role
terraform import module.ecokart.module.github_actions_role.aws_iam_role.github_actions ecokart-github-actions-role

# 2. Import Policies (8 existierende)
terraform import module.ecokart.module.github_actions_role.aws_iam_policy.amplify arn:aws:iam::729403197965:policy/ecokart-github-actions-role-amplify

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.apigateway arn:aws:iam::729403197965:policy/ecokart-github-actions-role-apigateway

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.cloudwatch arn:aws:iam::729403197965:policy/ecokart-github-actions-role-cloudwatch

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.dynamodb arn:aws:iam::729403197965:policy/ecokart-github-actions-role-dynamodb

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.iam arn:aws:iam::729403197965:policy/ecokart-github-actions-role-iam

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.lambda arn:aws:iam::729403197965:policy/ecokart-github-actions-role-lambda

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.s3 arn:aws:iam::729403197965:policy/ecokart-github-actions-role-s3

terraform import module.ecokart.module.github_actions_role.aws_iam_policy.ssm arn:aws:iam::729403197965:policy/ecokart-github-actions-role-ssm

# 3. Import Policy Attachments (8 existierende)
terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.amplify ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-amplify

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.apigateway ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-apigateway

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.cloudwatch ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-cloudwatch

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.dynamodb ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-dynamodb

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.iam ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-iam

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.lambda ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-lambda

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.s3 ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-s3

terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.ssm ecokart-github-actions-role/arn:aws:iam::729403197965:policy/ecokart-github-actions-role-ssm
```

## Neue Policies (werden automatisch erstellt)

Diese Policies werden automatisch beim nächsten `terraform apply` erstellt:

- ✅ **ecokart-github-actions-role-terraform-backend** (S3 + DynamoDB für Terraform State)
- ✅ **ecokart-github-actions-role-cognito** (Cognito User Pool Management)

## Verification

Nach dem Import:

```bash
# Zeigt dass Terraform die existierende Role kennt
terraform plan
```

**Erwartetes Ergebnis:**
- Keine Changes für existierende Role und 8 Policies
- 2 neue Policies werden erstellt (terraform-backend, cognito)
- 2 neue Policy Attachments werden erstellt

## Troubleshooting

### "Resource already exists"

Falls du die Policy schon manuell erstellt hast:

```bash
# Finde die ARN
aws iam list-policies --query "Policies[?PolicyName=='ecokart-github-actions-role-terraform-backend'].Arn" --output text

# Importiere sie
terraform import module.ecokart.module.github_actions_role.aws_iam_policy.terraform_backend <ARN>
terraform import module.ecokart.module.github_actions_role.aws_iam_role_policy_attachment.terraform_backend ecokart-github-actions-role/<ARN>
```
