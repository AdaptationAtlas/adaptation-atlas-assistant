resource "aws_secretsmanager_secret" "backend_secrets" {
  name = "atlas-backend"
}

resource "aws_secretsmanager_secret_version" "backend_secrets" {
  secret_id                = aws_secretsmanager_secret.backend_secrets.id
  secret_string_wo         = jsonencode(local.env)
  secret_string_wo_version = 7
}
