import { build } from 'esbuild';
await build({
  entryPoints:{migrate:'scripts/migrate.ts',bootstrap:'scripts/bootstrap.ts'},
  outdir:'dist-tools',outExtension:{'.js':'.cjs'},bundle:true,platform:'node',target:'node24',format:'cjs',external:['pg-native'],
});
