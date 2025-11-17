provider "aws" {
  region = var.region
  default_tags { tags = var.tags }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {}

locals {
  vpc_cidr = "10.0.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)

  container_port = 8000
  env = {
    MISTRAL_API_KEY = var.mistral_api_key
    CHAT_MODEL_SIZE = var.chat_model_size
    JWT_KEY         = var.jwt_key
    CORS_ORIGINS    = var.cors_origins
  }
}
