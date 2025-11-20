# ============================================================================
# API Gateway Cognito Authorizer
# ============================================================================
#
# Was macht diese Datei?
# - Fügt Cognito Authorizer zu API Gateway hinzu
# - Prüft JWT Token BEVOR Lambda aufgerufen wird
# - Spart Geld (ungültige Requests kosten keine Lambda-Zeit)
# - Erhöht Security (Lambda sieht nur valide User)
#
# Autor: Andy Schlegel
# Datum: 20. November 2025
# ============================================================================

# ----------------------------------------------------------------------------
# Cognito Authorizer
# ----------------------------------------------------------------------------
# Das ist der "Türsteher" für die API
# Prüft ob User einen gültigen Cognito Token hat

resource "aws_api_gateway_authorizer" "cognito" {
  # Nur erstellen wenn Cognito Auth aktiviert ist
  count = var.enable_cognito_auth ? 1 : 0

  name          = "${var.function_name}-cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.api.id

  # Welcher Cognito User Pool darf Tokens ausstellen?
  provider_arns = [var.cognito_user_pool_arn]

  # ----------------------------------------------------------------
  # Identity Source
  # ----------------------------------------------------------------
  # Wo im Request ist der Token?
  # Standard: Authorization Header mit "Bearer {token}"
  identity_source = "method.request.header.Authorization"

  # ----------------------------------------------------------------
  # Authorizer Result Caching
  # ----------------------------------------------------------------
  # Wie lange soll API Gateway das Ergebnis cachen?
  # 300 = 5 Minuten (Token wird nur alle 5 Min geprüft)
  #
  # Vorteil: Schneller + günstiger
  # Nachteil: Wenn User gelöscht wird, dauert bis zu 5 Min
  #
  # Für Development: 300 (5 Min) ist OK
  # Für Production: 60-300 (1-5 Min)
  authorizer_result_ttl_in_seconds = 300
}

# ----------------------------------------------------------------------------
# WICHTIG: Welche Routes brauchen Authentication?
# ----------------------------------------------------------------------------
#
# ÖFFENTLICH (kein Auth):
# - GET /api/products          → Jeder kann Produkte sehen
# - GET /api/products/:id      → Jeder kann Details sehen
#
# GESCHÜTZT (Cognito Auth):
# - POST /api/cart             → Nur eingeloggte User
# - POST /api/orders           → Nur eingeloggte User
# - GET /api/users/me          → Nur eingeloggte User
# - POST /api/products         → Nur Admins
# - PUT /api/products/:id      → Nur Admins
# - DELETE /api/products/:id   → Nur Admins
#
# ----------------------------------------------------------------
# Umsetzung:
# ----------------------------------------------------------------
#
# Option 1: API Gateway macht Auth-Check (AKTUELL)
#   → authorization = "COGNITO_USER_POOLS"
#   → authorizer_id = aws_api_gateway_authorizer.cognito.id
#   → API Gateway blockt ungültige Requests BEVOR Lambda
#
# Option 2: Lambda macht Auth-Check (ALT - vor Cognito)
#   → authorization = "NONE"
#   → Lambda prüft JWT selbst
#   → Ungültige Requests kosten Lambda-Zeit
#
# Wir nutzen Option 1 (günstiger + sicherer!)
#
# ----------------------------------------------------------------
# ABER: Wie unterscheiden wir öffentlich vs. geschützt?
# ----------------------------------------------------------------
#
# Lösung: In der main.tf werden die Methoden angelegt
# Dort entscheiden wir pro Route:
#
# Öffentlich:
#   authorization = "NONE"
#
# Geschützt:
#   authorization = "COGNITO_USER_POOLS"
#   authorizer_id = aws_api_gateway_authorizer.cognito[0].id
#
# ----------------------------------------------------------------

# ----------------------------------------------------------------
# Request Validator (Optional aber empfohlen)
# ----------------------------------------------------------------
# Prüft Request Format BEVOR Lambda aufgerufen wird
# Beispiel: Fehlende Required Headers → 400 Bad Request
#
# Spart Lambda-Kosten!

resource "aws_api_gateway_request_validator" "main" {
  count = var.enable_cognito_auth ? 1 : 0

  name                        = "${var.function_name}-request-validator"
  rest_api_id                 = aws_api_gateway_rest_api.api.id

  # Was soll validiert werden?
  validate_request_body       = false  # Body-Validation im Lambda (flexibler)
  validate_request_parameters = true   # Headers/Query-Params validieren
}

# ----------------------------------------------------------------
# CORS für Cognito
# ----------------------------------------------------------------
# Wichtig: CORS muss auch für OPTIONS Requests funktionieren
# Browser schickt OPTIONS Preflight OHNE Authorization Header!
#
# Deshalb: OPTIONS Method OHNE Authorizer

resource "aws_api_gateway_method" "proxy_options" {
  count = var.enable_cognito_auth ? 1 : 0

  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"  # OPTIONS braucht KEIN Auth!
}

resource "aws_api_gateway_integration" "proxy_options" {
  count = var.enable_cognito_auth ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options[0].http_method
  type        = "MOCK"

  # CORS Headers zurückgeben
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "proxy_options" {
  count = var.enable_cognito_auth ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options[0].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "proxy_options" {
  count = var.enable_cognito_auth ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options[0].http_method
  status_code = aws_api_gateway_method_response.proxy_options[0].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# ----------------------------------------------------------------
# Output für Debugging
# ----------------------------------------------------------------
# Zeigt ob Cognito Authorizer aktiviert ist

output "cognito_authorizer_enabled" {
  description = "Ist Cognito Authorizer aktiviert?"
  value       = var.enable_cognito_auth
}

output "cognito_authorizer_id" {
  description = "ID des Cognito Authorizers (falls aktiviert)"
  value       = var.enable_cognito_auth ? aws_api_gateway_authorizer.cognito[0].id : null
}
