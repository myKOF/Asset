'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function main() {
  const output = process.argv[2];
  if (!output) throw new Error('使用方式：node restore-master.cjs <輸出 MP4>');
  const web = path.join(__dirname, '..', 'web');
  const record = JSON.parse(fs.readFileSync(path.join(web, 'shots-01-04-100.7s.json'), 'utf8'));
  const chunks = record.parts.map(part => fs.readFileSync(path.join(web, part)));
  const sha = createHash('sha256');
  let bytes = 0;
  for (const chunk of chunks) {
    sha.update(chunk);
    bytes += chunk.length;
  }
  if (bytes !== record.bytes || sha.digest('hex') !== record.sha256) {
    throw new Error('核准連播的長度或 SHA-256 不符');
  }
  const fd = fs.openSync(output, 'wx');
  try {
    for (const chunk of chunks) fs.writeFileSync(fd, chunk);
  } finally {
    fs.closeSync(fd);
  }
  console.log('已還原核准連播：' + path.resolve(output));
}

main();
