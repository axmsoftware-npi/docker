provider "google" {
  project = "techstack-inovio"
  credentials = "${file("techstack-inovio-a2e05eea020a.json")}"
  region = "europe-west1"
}
