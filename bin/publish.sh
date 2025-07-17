HUSKY=0 \
  pnpm -r --workspace-concurrency=1 --filter "./services/*" --filter "./packages/database" \
  exec -- npx --no-install semantic-release
