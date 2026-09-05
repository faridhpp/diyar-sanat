import { spawn } from 'node:child_process';

// Migrations and the application use the existing Dokploy DATABASE_URL.
// No database container or additional login credentials are provisioned here.
let stopping=false;
function run(script) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[script],{stdio:'inherit',env:process.env});
    const terminate=()=>{stopping=true;child.kill('SIGTERM');};
    const interrupt=()=>{stopping=true;child.kill('SIGINT');};
    process.on('SIGTERM',terminate);process.on('SIGINT',interrupt);
    child.on('error',reject);
    child.on('exit',(code,signal)=>{
      process.off('SIGTERM',terminate);process.off('SIGINT',interrupt);
      if(code===0||stopping)resolve();else reject(new Error(signal||`Exit code ${code}`));
    });
  });
}
try {
  if(!process.env.DATABASE_URL)throw new Error('Missing DATABASE_URL');
  await run('tools/migrate.cjs');
  if(!stopping)await run('server.js');
} catch {
  console.error('Startup failed. Check DATABASE_URL and the preceding migration/application logs.');
  process.exitCode=1;
}
