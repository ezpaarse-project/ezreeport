HUSKY=0 \
  pnpm -r --workspace-concurrency=1 --filter ./services \
  exec -- npx --no-install semantic-release
