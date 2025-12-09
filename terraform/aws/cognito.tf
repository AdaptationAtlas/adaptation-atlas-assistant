resource "aws_cognito_user_pool" "atlas_pool" {
  name = "atlas-backend"

  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"
  mfa_configuration        = "ON"
  username_attributes      = ["email"]

  email_configuration {
    email_sending_account = "DEVELOPER"
    source_arn            = var.email_source_arn
    from_email_address    = var.from_email_address
  }
  email_mfa_configuration {}

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }
}

resource "aws_cognito_user_pool_client" "atlas_pool_client" {
  name         = "atlas-backend-client"
  user_pool_id = aws_cognito_user_pool.atlas_pool.id
  callback_urls = concat(
    ["https://api.${var.domain_name}/docs/oauth2-redirect"],
    jsondecode(var.cognito_redirect_urls),
  )
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "phone", "profile"]
  supported_identity_providers         = ["COGNITO"]
  prevent_user_existence_errors        = "ENABLED"
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  enable_token_revocation              = true
}

resource "aws_cognito_user_pool_domain" "default" {
  domain                = "adaptation-atlas"
  user_pool_id          = aws_cognito_user_pool.atlas_pool.id
  managed_login_version = 2
}

resource "aws_cognito_managed_login_branding" "client" {
  client_id    = aws_cognito_user_pool_client.atlas_pool_client.id
  user_pool_id = aws_cognito_user_pool.atlas_pool.id

  use_cognito_provided_values = true
}