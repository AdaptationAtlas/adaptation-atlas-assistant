module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 10.3.0"

  name = "atlas-lb"

  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnets

  security_group_ingress_rules = {
    all_http = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      cidr_ipv4   = "0.0.0.0/0"
    }
    all_https = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      cidr_ipv4   = "0.0.0.0/0"
    }
  }
  security_group_egress_rules = {
    all = {
      ip_protocol = "-1"
      cidr_ipv4   = module.vpc.vpc_cidr_block
    }
  }

  listeners = {
    ecs-http-https-redirect = {
      port     = 80
      protocol = "HTTP"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
    ecs-https = {
      port            = 443
      protocol        = "HTTPS"
      ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-Res-2021-06"
      certificate_arn = module.acm.acm_certificate_arn

      forward = {
        target_group_key = "ecs_tg"
      }
    }
  }

  target_groups = {
    ecs_tg = {
      backend_protocol  = "HTTP"
      backend_port      = local.container_port
      target_type       = "ip"
      create_attachment = false

      health_check = {
        enabled             = true
        healthy_threshold   = 5
        interval            = 30
        path                = "/health"
        timeout             = 5
        unhealthy_threshold = 2
      }
    }
  }

  tags = var.tags
}

resource "aws_route53_record" "atlas_assistant_api" {
  provider = aws.dns
  zone_id  = data.aws_route53_zone.ecs_domain.zone_id
  name     = var.api_subdomain
  type     = "A"
  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }
}