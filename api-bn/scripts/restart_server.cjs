// Restart api-bn server with current dist/bundle.js
// Captures STDOUT/STDERR to server.log so debug/console logs are visible via tail.
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'server.log');

console.log('Killing any process on port 3000...');
// Method 1: netstat + find PID + taskkill
try {
  const netstatOut = execSync('netstat -ano | findstr ":3000 "', { encoding: 'utf8', timeout: 5000 });
  const lines = netstatOut.trim().split('\n').filter(l => l.includes('LISTENING'));
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      try {
        execSync(`taskkill /F /PID ${pid} 2>nul`, { stdio: 'ignore' });
        console.log(` Killed PID ${pid} on port 3000`);
      } catch {}
    }
  }
} catch {}

// Method 2: any node process that might be the server
try { execSync('taskkill /F /FI "IMAGENAME eq node.exe" /FI "CPUTIME gt 00:00:05" 2>nul', { stdio: 'ignore' }); } catch {}

// Wait for port to free
try {
  for (let i = 0; i < 10; i++) {
    try {
      execSync('curl -s http://localhost:3000/health --connect-timeout 1 2>nul', { stdio: 'ignore' });
    } catch (e) {
      // Port is free if curl fails (code from execSync)
      // On Windows execSync throws on non-0 exit
      break;
    }
    execSync('sleep 0.5 2>nul || timeout /t 1 /nobreak >nul 2>&1', { stdio: 'ignore' });
  }
} catch {}

console.log('Starting new node server with current bundle...');
// Truncate log file first
try { fs.writeFileSync(LOG_FILE, ''); } catch {}

const out = fs.openSync(LOG_FILE, 'a');
const err = fs.openSync(LOG_FILE, 'a');
const proc = spawn('node', ['dist/bundle.js'], {
  detached: true,
  stdio: ['ignore', out, err],
});

proc.unref();
console.log(`Started detached, PID=${proc.pid}. Logs: tail -f server.log`);
