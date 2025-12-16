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
      deployment_circuit_breaker = {
        enable   = true
        rollback = true
      }
      task_exec_iam_role_name = "atlas-backend-taskexec"
      tasks_iam_role_name     = "atlas-backend-tasks"
      task_exec_secret_arns = [
        aws_secretsmanager_secret.backend_secrets.arn,
      ]

      container_definitions = {

        api = {
          cpu               = 512
          memory            = 1024
          essential         = true
          image             = join(":", [module.ecr.repository_url, var.api_image_tag])
          memoryReservation = 100
          command = [
            "uvicorn",
            "atlas_assistant.api:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
            "--log-config",
            "logging.yaml"
          ]
          portMappings = [
            {
              containerPort = local.container_port
            }
          ]
          readonlyRootFilesystem = false
          secrets = [
            for k in keys(local.env) :
            {
              name      = k
              valueFrom = join(":", [aws_secretsmanager_secret.backend_secrets.arn, "${k}::"])
            }
          ]
        }
      }

      load_balancer = {
        service = {
          target_group_arn = module.alb.target_groups["ecs_tg"].arn
          container_name   = "api"
          container_port   = local.container_port
        }
      }

      subnet_ids = module.vpc.private_subnets

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
