module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "atlas-vpc"
  cidr = local.vpc_cidr

  azs             = local.azs
  private_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 4, k)]
  public_subnets  = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 64)]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = var.tags
}