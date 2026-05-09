environment           = "dev"
region                = "us-east-1"
state_bucket          = "tfstate-atlas"
domain_name           = "adaptationatlas.cgiar.org"
api_subdomain         = "atlas-assistant-api"
cors_origins          = "[\"https://adaptationatlas.github.io\"]"
cognito_redirect_urls = "[\"https://adaptationatlas.github.io/adaptation-atlas-assistant/\", \"http://localhost:5173\"]"
embeddings_directory  = "/app/data/embeddings"
tags = {
  project = "atlas-assistant"
}
