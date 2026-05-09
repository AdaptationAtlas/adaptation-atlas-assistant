data "aws_route53_zone" "ecs_domain" {
  provider     = aws.dns
  name         = var.domain_name
  private_zone = false
}

module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 6.2.0"

  domain_name = var.domain_name
  zone_id     = data.aws_route53_zone.ecs_domain.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}",
  ]

  validation_method       = "DNS"
  create_route53_records  = false
  validation_record_fqdns = module.route53_validation.validation_route53_record_fqdns
}

module "route53_validation" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 6.2.0"

  providers = {
    aws = aws.dns
  }

  create_certificate          = false
  create_route53_records_only = true
  validation_method           = "DNS"

  zone_id               = data.aws_route53_zone.ecs_domain.zone_id
  distinct_domain_names = module.acm.distinct_domain_names

  acm_certificate_domain_validation_options = module.acm.acm_certificate_domain_validation_options
}
