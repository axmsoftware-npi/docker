resource "google_storage_bucket" "tika-source" {
  name = "${var.source_bucket}"
  location = "EU"
}

resource "google_storage_bucket" "tika-out" {
  name = "${var.out_bucket}"
  location = "EU"
}

