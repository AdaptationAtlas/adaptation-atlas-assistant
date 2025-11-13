module "ecs" {
  source = "terraform-aws-modules/ecs/aws"

  cluster_name = "atlas-cluster"

  default_capacity_provider_strategy = {
    FARGATE = {
      weight = 50
      base   = 20
    }
    FARGATE_SPOT = {
      weight = 50
    }
  }

  services = {
    atlas-backend = {
      cpu    = 1024
      memory = 4096

      enable_execute_command = true
      container_definitions = {

        api = {
          cpu               = 512
          memory            = 1024
          essential         = true
          image             = join(":", [module.ecr.repository_url, "latest"])
          memoryReservation = 100
          command           = ["uv", "run", "--no-sync", "uvicorn", "src.atlas_assistant.api:app", "--host", "0.0.0.0", "--port", "8000"]
          portMappings = [
            {
              containerPort = local.container_port
            }
          ]
          readonlyRootFilesystem = false
        }
      }

      load_balancer = {
        service = {
          target_group_arn = module.alb.target_groups["ecs_tg"].arn
          container_name   = "api"
          container_port   = local.container_port
        }
      }

      subnet_ids = module.vpc.public_subnets

      security_group_ingress_rules = {
        ecs_alb = {
          from_port                    = local.container_port
          ip_protocol                  = "tcp"
          referenced_security_group_id = module.alb.security_group_id
        }
      }
      security_group_egress_rules = {
        all = {
          ip_protocol = "-1"
          cidr_ipv4   = "0.0.0.0/0"
        }
      }
    }
  }

  tags = var.tags
}