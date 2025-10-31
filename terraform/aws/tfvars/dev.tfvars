environment  = "dev"
region       = "us-east-1"
state_bucket = "tfstate-atlas"
lock_table   = "tfstate-locks"
domain_name  = "atlas-assistant.ds.io"
tags = {
  project = "atlas-assistant"
  owner   = "orbaco"
  client  = "cgiar"
}