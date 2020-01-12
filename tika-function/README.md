Terraform v0.11.14

Put to the provider.tf your GCP project name, region and path to your credentials (to the backend.tf as well)

Create manually bucket for the tf state and change bucket name in backend.tf (techstack-terraform-state in this example)

Run:
* terraform init
* terraform plan 
* terraform apply
