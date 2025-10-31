resource "aws_secretsmanager_secret" "api_secrets" {
  name = "atlas-api"
}

resource "aws_secretsmanager_secret_version" "api_secrets" {
  secret_id     = aws_secretsmanager_secret.api_secrets.id
  secret_string = <<EOF
   {
    "MISTRAL_API_KEY": "${var.mistral_api_key}",
    "CHAT_MODEL_SIZE": "${var.chat_model_size}",
    "JWT_KEY": "${var.jwt_key}",
   }
  EOF
}