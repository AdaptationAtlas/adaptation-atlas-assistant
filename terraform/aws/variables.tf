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

variable "chat_model__type" {
  type        = string
  default     = ""
  description = <<-EOT
  The type of chat model to use.
  EOT
}

variable "chat_model__api_key" {
  type        = string
  default     = ""
  sensitive   = true
  ephemeral   = true
  description = <<-EOT
  Key for the chat agent
  EOT
}

variable "chat_model__size" {
  type        = string
  default     = ""
  description = <<-EOT
  ex: small, large
  EOT
}

variable "cors_origins" {
  type        = string
  default     = "[]"
  description = <<-EOT
  Allowed CORS origins
  EOT
}

variable "cognito_redirect_urls" {
  type        = string
  default     = "[]"
  description = <<-EOT
  Allowed OAuth callback/redirect URLs for Cognito (JSON array string).
  These should include full paths, e.g., "https://example.com/app/"
  EOT
}

variable "api_image_tag" {
  type        = string
  default     = "latest"
  description = <<-EOT
  Image tag to use in deployment
  EOT
}

variable "embeddings_directory" {
  type        = string
  default     = null
  description = <<-EOT
  Path to embeddings directory
  EOT
}
