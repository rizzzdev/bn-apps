# Build with esbuild (handles compilation, aliases, Prisma files all in one step)
Write-Output "Running esbuild build..."
node scripts/build.mjs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
Write-Output "Build complete."
