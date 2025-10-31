resource "aws_iam_role" "ecs_elb_permissions" {
  name = "atlas-ecs-elb-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "ecs-tasks.amazonaws.com",
            "ecs.amazonaws.com",
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_service_role" {
  role       = aws_iam_role.ecs_elb_permissions.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole"
}

resource "aws_iam_role_policy_attachment" "ecs_elb_management_role" {
  role       = aws_iam_role.ecs_elb_permissions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECSInfrastructureRolePolicyForLoadBalancers"
}


resource "aws_iam_policy" "secret_manager_read_secret" {
  name        = "atlas-read-sm"
  description = "Grants read, list and describe permissions on SecretManager secrets"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecretVersionIds"
        ]
        Effect = "Allow"
        Resource = [
          aws_secretsmanager_secret.api_secrets.arn
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "atlas_read_secret" {
  role       = aws_iam_role.ecs_elb_permissions.name
  policy_arn = aws_iam_policy.secret_manager_read_secret.arn
}