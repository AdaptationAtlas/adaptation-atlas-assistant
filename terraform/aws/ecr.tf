module "ecr" {
  source = "terraform-aws-modules/ecr/aws"

  repository_name = "atlas"

  repository_image_tag_mutability = "IMMUTABLE_WITH_EXCLUSION"
  repository_image_tag_mutability_exclusion_filter = [
    {
      filter      = "latest*"
      filter_type = "WILDCARD"
    }
  ]

  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 3 images",
        selection = {
          tagStatus   = "untagged",
          countType   = "imageCountMoreThan",
          countNumber = 3
        },
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2,
        description  = "Keep last 5 tagged images",
        selection = {
          tagStatus   = "tagged",
          tagPrefixList = ["sha-"],
          countType   = "imageCountMoreThan",
          countNumber = 5
        },
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = var.tags
}