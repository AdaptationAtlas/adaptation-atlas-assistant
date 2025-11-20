environment     = "dev"
region          = "us-east-1"
state_bucket    = "tfstate-atlas"
domain_name     = "atlas-assistant.ds.io"
chat_model_size = "large"
cors_origins    = "[\"https://adaptationatlas.github.io\"]"
tags = {
  project = "atlas-assistant"
  owner   = "orbaco"
  client  = "cgiar"
}