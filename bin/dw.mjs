#!/usr/bin/env node

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`dw-kit requires Node.js >= 18. Current: ${process.version}`);
  process.exit(1);
}

process.on('unhandledRejection', (reason) => {
  console.error();
  console.error('  Unexpected error:', reason?.message || reason);
  if (reason?.code === 'EACCES' || reason?.code === 'EPERM') {
    console.error('  Permission denied. Try running with appropriate permissions.');
  }
  if (reason?.code === 'ENOSPC') {
    console.error('  Disk full. Free up space and try again.');
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error();
  console.error('  Fatal error:', error.message);
  process.exit(1);
});

const { run } = await import('../src/cli.mjs');
run(process.argv);
