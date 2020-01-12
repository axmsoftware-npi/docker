terraform {
  backend "gcs" {
    bucket = "techstack-terraform-state"
    prefix = "terraform/state"
    credentials = "techstack-inovio-a2e05eea020a.json"    
  }
}
