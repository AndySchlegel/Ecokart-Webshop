# ================================================================
# Cognito Admin User Auto-Provisioner
# ================================================================
#
# Was macht diese Ressource?
# - Erstellt automatisch einen Admin User nach User Pool Erstellung
# - Läuft bei jedem "terraform apply" (idempotent = safe)
# - Überspringt Erstellung wenn User bereits existiert
#
# Vorteile:
# - Kein manuelles Admin-Setup mehr nötig
# - Nach destroy/redeploy automatisch wieder da
# - Konsistent über alle Environments
#
# ================================================================

# ----------------------------------------------------------------
# Null Resource - Führt Script nach User Pool Erstellung aus
# ----------------------------------------------------------------
resource "null_resource" "create_admin_user" {
  # Nur erstellen wenn enable_admin_provisioning = true
  count = var.enable_admin_provisioning ? 1 : 0

  # Trigger: Läuft wenn User Pool ID sich ändert (= neu erstellt)
  triggers = {
    user_pool_id = aws_cognito_user_pool.main.id
    admin_email  = var.admin_email
  }

  # Script ausführen nachdem User Pool erstellt wurde
  provisioner "local-exec" {
    command = <<-EOT
      chmod +x ${path.module}/scripts/create-admin-user.sh
      ${path.module}/scripts/create-admin-user.sh \
        "${aws_cognito_user_pool.main.id}" \
        "${var.admin_email}" \
        "${var.admin_temp_password}" \
        "${data.aws_region.current.name}"
    EOT
  }

  depends_on = [
    aws_cognito_user_pool.main,
    aws_cognito_user_pool_client.client
  ]
}

# ----------------------------------------------------------------
# Data Source - Aktuelle AWS Region
# ----------------------------------------------------------------
data "aws_region" "current" {}

# ----------------------------------------------------------------
# Output - Admin User Credentials (nur für Development!)
# ----------------------------------------------------------------
output "admin_user_credentials" {
  description = "Admin User Credentials (NUR FÜR DEVELOPMENT! In Production: Secret Manager nutzen)"
  value = var.enable_admin_provisioning ? {
    email            = var.admin_email
    temporary_password = var.admin_temp_password
    role             = "admin"
    note             = "Beim ersten Login musst du das Passwort ändern!"
  } : null
  sensitive = true
}
