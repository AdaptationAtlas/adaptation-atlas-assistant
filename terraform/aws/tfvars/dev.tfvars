environment          = "dev"
region               = "us-east-1"
state_bucket         = "tfstate-atlas"
domain_name          = "atlas-assistant.ds.io"
chat_model_size      = "large"
cors_origins          = "[\"https://adaptationatlas.github.io\"]"
cognito_redirect_urls = "[\"https://api.atlas-assistant.ds.io/docs/oauth2-redirect\",\"https://adaptationatlas.github.io/adaptation-atlas-assistant/\", \"http://localhost:5173\"]"
embeddings_directory = "/app/data/embeddings"
tags = {
  project = "atlas-assistant"
  owner   = "orbaco"
  client  = "cgiar"
}
