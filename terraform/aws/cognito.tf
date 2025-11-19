resource "aws_cognito_user_pool" "atlas_pool" {
  name = "atlas-backend"

  auto_verified_attributes = ["email"]
  deletion_protection      = "INACTIVE" # TODO
  mfa_configuration        = "ON"

  email_configuration {
    email_sending_account = "DEVELOPER"
    source_arn            = aws_ses_email_identity.temp.arn
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

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

resource "aws_ses_email_identity" "temp" {
  email = "ali@developmentseed.org" # TODO
}

resource "aws_cognito_user_pool_client" "atlas_pool_client" {
  name         = "atlas-backend-client"
  user_pool_id = aws_cognito_user_pool.atlas_pool.id
  callback_urls = [
    "https://${module.alb.dns_name}/oauth2/idpresponse",
    "https://api.${var.domain_name}/oauth2/idpresponse",
  ]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid"]
  supported_identity_providers         = ["COGNITO"]
  prevent_user_existence_errors        = "ENABLED"
  generate_secret                      = true
}

# # See below links on parent domain A records. 
# # Dummy record for parents so Cognito stops validation.
# # 1. Uncomment this block
# # 2. Comment out aws_cognito_user_pool_domain.main and aws_route53_record.cognito_alias
# # 
# # https://repost.aws/knowledge-center/cognito-custom-domain-errors
# # https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-add-custom-domain.html#cognito-user-pools-add-custom-domain-prereq
# resource "aws_route53_record" "cognito_temp" {
#   name    = var.domain_name
#   type    = "A"
#   zone_id = data.aws_route53_zone.ecs_domain.zone_id
#   ttl     = 900
#   records = ["8.8.8.8"]
# }

resource "aws_cognito_user_pool_domain" "main" {
  domain                = "auth.${var.domain_name}"
  certificate_arn       = module.acm.acm_certificate_arn
  user_pool_id          = aws_cognito_user_pool.atlas_pool.id
  managed_login_version = 2
}

resource "aws_route53_record" "cognito_alias" {
  name    = aws_cognito_user_pool_domain.main.domain
  type    = "A"
  zone_id = data.aws_route53_zone.ecs_domain.zone_id
  alias {
    evaluate_target_health = false

    name    = aws_cognito_user_pool_domain.main.cloudfront_distribution
    zone_id = aws_cognito_user_pool_domain.main.cloudfront_distribution_zone_id
  }
}

resource "aws_cognito_managed_login_branding" "client" {
  client_id    = aws_cognito_user_pool_client.atlas_pool_client.id
  user_pool_id = aws_cognito_user_pool.atlas_pool.id

  use_cognito_provided_values = true
}