module "ecr" {
  source = "terraform-aws-modules/ecr/aws"

  repository_name = "atlas"

  repository_read_write_access_arns = [data.aws_caller_identity.current.arn]
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 10 images",
        selection = {
          tagStatus   = "untagged",
          countType   = "imageCountMoreThan",
          countNumber = 10
        },
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = var.tags
}