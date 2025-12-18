# Terraform Infrastructure - AWS

## Development

Cloud resources for the Atlas Assistant are defined and managed using the Infrastructure as Code tool [Terraform]. 

This build largely uses AWS-provided modules (ie reusable collections of resource configurations) to scaffold core services.

- [Virtual Private Cloud (VPC)]: Private cloud network with public and private subnets across 3 availability zones
- [Application Load Balancer (ALB)]: Entrypoint distributing inbound traffic across one or more target groups
- [AWS Certificate Manager (ACM)]: SSL/TLS to secure HTTPS traffic
- [Elastic Container Service (ECS)]: Container management and orchestration
- [Elastic Container Registry (ECR)]: Private container image repository

[`resource`-level definitions], such as Cognito pools, are also used for supporting infrastructure. 

### External Dependencies

- Route 53 hosted zone for API domain
- Verified SES identity for Cognito email
- S3 bucket for Terraform state (`tfstate-atlas`)

## Local Development

Most development needs are covered by GitHub Actions workflows, which should be preferred for visibility and consistency. For debugging or performing less common operations, local setup is similar to setup in CI/CD.

### Tools

- [AWS CLI]
    - [Systems Manager Plugin] (optional, enables connecting to containers from local machine)
- [Terraform CLI]

### Setup

Terraform needs to connect with AWS for most operations. Specific setup guidance can vary considering factors such as organization policies, principal types, and authentication methods, so defer to internal procedures.

1. Install the AWS CLI 
1. Configure a profile for the target account and region
    1. Organizations may have certain policies or specific guidance on authenticating to cloud services from a local machine
    1. General guidance on [configuration] and [authentication]
1. If using a non-default profile, set the correct profile per-session or per-command
    ```sh
    # per-session
    $ export AWS_PROFILE=<profile>
    $ terraform init
    $ terraform plan [...]

    # per-command
    $ AWS_PROFILE=<profile> terraform init
    $ AWS_PROFILE=<profile> terraform plan [...]
    ```

### Usage

#### Terraform

```sh
## Terraform commands look for configuration files relative to current directory
## Skip if using inline `-chdir` flag
cd terraform/aws

## Initialize Terraform with remote backend
terraform init

## Summarize differences between configuration and remote state with proposed changes
terraform plan -var-file=tfvars/dev.tfvars \
  -var="chat_model__type=<model_type>" \
  -var="chat_model__api_key=<your-api-key>" \
  -var="chat_model__size=<model_size>"
```

#### AWS / ECS / Connect to Containers

Containers are set up with ECS Exec for remote connection

```sh
## Get ARN or ID for task container
aws ecs list-tasks --cluster atlas-cluster --service atlas-backend

## Connect to container from local machine (requires Systems Manager Plugin)
aws ecs execute-command --region us-east-1 \
  --cluster atlas-cluster \
  --task <task_arn> \
  --container api \
  --interactive \
  --command '/bin/sh'
```

#### AWS / ECR / Push to Registry

Recommend pushing from local only for development images with non-production tagging (e.g. `:dev`). Production images should go through CI/CD.

```sh
## Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS \
  --password-stdin \
  <account_id>.dkr.ecr.us-east-1.amazonaws.com

## Tag built image
docker tag <image> <account_id>.dkr.ecr.us-east-1.amazonaws.com/atlas:<image_tag>

## Push to registry
docker push <account_id>.dkr.ecr.us-east-1.amazonaws.com/atlas:<image_tag>
```

## Variables + Secrets

Security best practice is to avoid exposing sensitive values in build artifacts. This configuration uses a combination of [AWS Secrets Manager references] and Terraform's ephemeral + write-only features to prevent capturing these values in state files and task definitions.

### Define Build Arguments

1. Define a parameter in [variables.tf]
1. Pass in the value at build time using input variables
    1. Non-sensitive values can be set in [dev.tfvars]
    1. Sensitive values should be stored as secrets in GitHub Actions and set in the build environment prefixed with `TF_VAR_`
        1. Example: 
            1. Define variable `foo_password` in [variables.tf]
            1. Store sensitive value in GitHub secrets
            1. Set `TF_VAR_foo_password = ${{ secrets.<gha_secret_name> }}` in build environment

### Use Build Arguments

1. Reference variables as `var.<tf_variable_name>`, where `<tf_variable_name>` is the identifier used in [variables.tf]
    ```hcl
    # variables.tf
    variable "foo" { }
    
    # main.tf
    resource "bar" {
      name = var.foo
    }
    ```

### Application-Specific Variables + Secrets

To update the values used in the application at runtime (e.g. LLM keys):

1. If its not already, add the variable to the `locals` block in [main.tf] under `application_env`
    1. This object is used to populate the Secrets Manager secret and set pointers for the container to reference
1. Increment the `secret_string_wo_version` in [secrets_manager.tf] to trigger an update
    1. Using ephemeral, [write-only arguments] prevents sensitive values from being stored in state, however, this also means Terraform won't be able to track if/when values change. 
    1. Incrementing the version triggers an update as an alternative to auto-detection

Note: a similar effect can be achieved using other solutions, such as manual secret management and [programmatic retrieval]. Alternatives should consider risk of secret exposure, failure recovery, maintenance overhead, and alignment with overall security posture.

[Terraform]:
  (https://developer.hashicorp.com/terraform)
[Virtual Private Cloud (VPC)]:
  https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest
[Application Load Balancer (ALB)]:
  https://registry.terraform.io/modules/terraform-aws-modules/alb/aws/latest
[AWS Certificate Manager (ACM)]:
  https://registry.terraform.io/modules/terraform-aws-modules/acm/aws/latest
[Elastic Container Service (ECS)]:
  https://registry.terraform.io/modules/terraform-aws-modules/ecs/aws/latest
[Elastic Container Registry (ECR)]:
  https://registry.terraform.io/modules/terraform-aws-modules/ecr/aws/latest
[`resource`-level definitions]:
  https://registry.terraform.io/providers/hashicorp/aws/latest/docs
[AWS CLI]:
  https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html
[Systems Manager Plugin]:
  https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
[Terraform CLI]:
  https://developer.hashicorp.com/terraform/install
[configuration]:
  https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html
[authentication]:
  https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html
[AWS Secrets Manager references]:
  https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html
[variables.tf]:
  ./variables.tf
[dev.tfvars]:
  ./tfvars/dev.tfvars
[main.tf]:
  ./main.tf
[secrets_manager.tf]:
  ./secrets_manager.tf
[write-only arguments]:
  https://developer.hashicorp.com/terraform/language/manage-sensitive-data/write-only
[programmatic retrieval]:
  https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-app-secrets-manager.html

  