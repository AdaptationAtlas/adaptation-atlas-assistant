variable "environment" {
  type        = string
  default     = "development"
  description = <<-EOT
  Deploy environment
  EOT
}

variable "region" {
  type        = string
  description = <<-EOT
  AWS region to perform all our operations in.
  EOT
}

variable "state_bucket" {
  type        = string
  default     = ""
  description = <<-EOT
  S3 bucket for remote state backend
  EOT
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = <<-EOT
  (Optional) AWS resource tags.
  EOT
}

variable "domain_name" {
  type        = string
  default     = ""
  description = <<-EOT
  DNS host
  EOT
}

variable "mistral_api_key" {
  type        = string
  default     = ""
  sensitive   = true
  ephemeral   = true
  description = <<-EOT
  Key for Mistral agent
  EOT
}

variable "chat_model_size" {
  type        = string
  default     = ""
  description = <<-EOT
  ex: small, large
  EOT
}

variable "jwt_key" {
  type        = string
  default     = ""
  sensitive   = true
  ephemeral   = true
  description = <<-EOT
  API key
  EOT
}

variable "cors_origins" {
  type        = string
  default     = ""
  description = <<-EOT
  Allowed CORS origins
  EOT
}
