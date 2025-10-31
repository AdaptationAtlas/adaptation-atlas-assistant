data "aws_route53_zone" "ecs_domain" {
  name         = var.domain_name
  private_zone = false
}

module "acm" {
  source = "terraform-aws-modules/acm/aws"

  domain_name = var.domain_name
  zone_id     = data.aws_route53_zone.ecs_domain.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}",
  ]

  validation_method = "DNS"
}