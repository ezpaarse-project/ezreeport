HUSKY=0 \
  pnpm -r --workspace-concurrency=1 \
  --filter !ezreeport-common \
  exec -- npx --no-install semantic-release