data "archive_file" "function" {
  type = "zip"
  output_path = "tika.zip"
  source_dir = "./function"
}

resource "google_storage_bucket" "tika-function" {
  name = "tika-function"
  location = "EU"
}

resource "google_storage_bucket_object" "archive" {
  name   = "index.zip"
  bucket = "${google_storage_bucket.tika-function.name}"
  source = "./tika.zip"
}

resource "google_cloudfunctions_function" "tika-function" {
  name = "tika-function"
  runtime = "${var.runtime}"
  available_memory_mb = 128
  source_archive_bucket = "${google_storage_bucket.tika-function.name}"
  source_archive_object =  "${google_storage_bucket_object.archive.name}"
  trigger_http          = true
  entry_point           = "${var.entry_point}"

  environment_variables = {
    TIKA_ADDRESS = "${var.tika_address}"
  }
}
