group "default" {
  targets = ["api", "worker", "scheduler", "mail", "aio", "vuedoc"]
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

target "worker" {
  inherits = ["_base"]
  target = "worker"
  output = [{ type = "registry" }]
  tags = [
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/worker:${VERSION}",
    "ghcr.io/ezpaarse-project/ezreeport-worker:${VERSION}"
  ]
}

target "scheduler" {
  inherits = ["_base"]
  target = "scheduler"
  output = [{ type = "registry" }]
  tags = [
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/scheduler:${VERSION}",
    "ghcr.io/ezpaarse-project/ezreeport-scheduler:${VERSION}"
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

target "aio" {
  inherits = ["_base"]
  target = "aio"
  output = [{ type = "registry" }]
  tags = [
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/aio:${VERSION}",
    "ghcr.io/ezpaarse-project/ezreeport:${VERSION}"
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
    "vxnexus-registry.intra.inist.fr:8083/ezreeport/vuedoc:${VERSION}",
    "ghcr.io/ezpaarse-project/ezreeport-vuedoc:${VERSION}"
  ]
}
