pnpm -w exec -- npx npm-check -u

pnpm -r --workspace-concurrency=1 \
  exec -- npx npm-check -u
