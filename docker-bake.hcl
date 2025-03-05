group "default" {
  targets = ["api", "mail", "vuedoc"]
}

variable "VERSION" {
  default = "latest"
}

target "_base" {
  context = "."
  dockerfile = "Dockerfile"
}

target "api" {
  inherits = ["_base"]
  target = "api"
  output = [{ type = "registry" }]
  tags = [
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/api:${VERSION}",
    "ghcr.io/ezpaarse-project/ezreeport-api:${VERSION}"
  ]
}

target "mail" {
  inherits = ["_base"]
  target = "mail"
  output = [{ type = "registry" }]
  tags = [
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/mail:${VERSION}",
    "ghcr.io/ezpaarse-project/ezreeport-mail:${VERSION}"
  ]
}

target "sdk" {
  inherits = ["_base"]
  target = "sdk-pnpm"
  output = [{ type = "local", dest = "services/sdk/dist" }]
}

target "vue" {
  inherits = ["_base"]
  target = "vue-pnpm"
  output = [{ type = "local", dest = "services/vue/dist" }]
}

target "vuedoc" {
  inherits = ["_base"]
  target = "vuedoc"
  output = [{ type = "registry" }]
  tags = [
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/vuedoc:${VERSION}:",
    "ghcr.io/ezpaarse-project/ezreeport-vuedoc:${VERSION}:"
  ]
}
