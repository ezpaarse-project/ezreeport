HUSKY=0 \
  pnpm -r --workspace-concurrency=1 \
  --filter !ezreeport-common \
  --filter !ezreeport-vue-example \
  exec -- npx --no-install semantic-release