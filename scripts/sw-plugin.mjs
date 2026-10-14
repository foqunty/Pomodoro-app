// Tiny build step (no dependency): fills public/sw.js with the list of built files and a content-hash
// version, so the offline cache is exactly the app's own files and is replaced whenever they change.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SKIP = new Set(['sw.js', 'fonts/README.txt'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

export default function swPrecache() {
  let outDir = 'dist'
  return {
    name: 'sw-precache',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => !SKIP.has(f) && !f.endsWith('.map'))
        .sort()
      const hash = createHash('sha256')
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)))
      const urls = ['/', ...files.map((f) => '/' + f)]
      const swPath = join(outDir, 'sw.js')
      const src = readFileSync(swPath, 'utf8')
        .replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 12))
        .replace('__PRECACHE__', JSON.stringify(urls))
      writeFileSync(swPath, src)
    },
  }
}
