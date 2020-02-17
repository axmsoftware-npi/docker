variable "tika_address" {
  default = "https://tika.k8s.inovio.co/"
}

variable "runtime" {
  default = "nodejs8"
}

variable "entry_point" {
  default = "validate"
}

variable "source_bucket" {
  default = "tika-source"
}

variable "out_bucket" {
  default = "tika-out"
}
