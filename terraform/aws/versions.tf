terraform {
  required_version = "~> 1.13.5"
  backend "s3" {
    region       = "us-east-1"
    bucket       = "tfstate-atlas"
    key          = "dev/terraform.tfstate"
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
  }
}