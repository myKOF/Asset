'use strict';

const { readFile } = require('node:fs/promises');
const { setTimeout: delay } = require('node:timers/promises');

function frameRange(total) {
  if (process.argv[2] !== '--frames') return { from: 0, to: total, partial: false };
  const [from, to] = process.argv.slice(3).map(Number);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to <= from || to > total) {
    throw new Error('Use --frames START END with a valid zero-based frame range.');
  }
  return { from, to, partial: true };
}

async function readDevToolsPort(file) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const port = Number((await readFile(file, 'utf8')).split(/\r?\n/)[0]);
      if (port > 0) return port;
    } catch (error) {
      if (!['ENOENT', 'EBUSY', 'EACCES'].includes(error.code)) throw error;
    }
    await delay(100);
  }
  throw new Error('Edge did not publish a DevTools port.');
}

module.exports = { frameRange, readDevToolsPort };
