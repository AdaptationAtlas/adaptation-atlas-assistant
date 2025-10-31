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

variable "lock_table" {
  type        = string
  default     = ""
  description = <<-EOT
  Dynamo table to use for consistency checks (when using an s3 backend)
  EOT
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = <<-EOT
  (Optional) AWS resource tags.
  EOT
}

variable "permissions_boundary" {
  type        = string
  default     = null
  sensitive   = true
  description = <<-EOT
  (Optional) ARN of the policy that is used to set the permissions boundary for
  the role.
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
  description = <<-EOT
  API key
  EOT
}
