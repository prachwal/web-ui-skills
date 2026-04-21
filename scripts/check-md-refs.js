#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

function isRemote(link) {
  return /^https?:\/\//i.test(link) || /^mailto:/i.test(link);
}

function normalizeAnchor(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/["'`(),.:;!?\[\]{}<>\/\\@#$%^&*=+~]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch (e) {
    return false;
  }
}

async function findMdFiles(dir) {
  const out = [];
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        // skip node_modules and .git
        if (e.name === 'node_modules' || e.name === '.git') continue;
        await walk(full);
      } else if (e.isFile() && e.name.endsWith('.md')) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

async function checkFile(mdPath, repoRoot) {
  const text = await fs.readFile(mdPath, 'utf8');
  const linkRe = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const problems = [];
  let m;
  while ((m = linkRe.exec(text)) !== null) {
    let link = m[1].trim();
    // ignore empty
    if (!link) continue;
    // ignore remote
    if (isRemote(link)) continue;
    // ignore anchor-only links (will resolve to same file)
    const anchorOnly = link.startsWith('#');
    const [rawPath, rawAnchor] = link.split('#');
    const anchor = rawAnchor ? rawAnchor : null;
    let targetPath;
    if (anchorOnly) {
      targetPath = mdPath; // same file
    } else if (rawPath.startsWith('/')) {
      targetPath = path.join(repoRoot, rawPath.replace(/^\//, ''));
    } else {
      targetPath = path.resolve(path.dirname(mdPath), rawPath);
    }

    // If targetPath has no extension, try a few options
    const candidates = [];
    if (path.extname(targetPath)) {
      candidates.push(targetPath);
    } else {
      candidates.push(targetPath);
      candidates.push(targetPath + '.md');
      candidates.push(path.join(targetPath, 'README.md'));
      candidates.push(path.join(targetPath, 'index.md'));
    }

    let found = false;
    let foundPath = null;
    for (const c of candidates) {
      if (await exists(c)) {
        found = true;
        foundPath = c;
        break;
      }
    }

    if (!found) {
      problems.push({ type: 'missing-file', link, mdPath });
      continue;
    }

    if (anchor) {
      // verify anchor exists in foundPath
      const ftext = await fs.readFile(foundPath, 'utf8');
      const headingRe = /^#{1,6}\s+(.+)$/gm;
      let ok = false;
      let h;
      while ((h = headingRe.exec(ftext)) !== null) {
        const norm = normalizeAnchor(h[1]);
        if (norm === normalizeAnchor(anchor)) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        problems.push({ type: 'missing-anchor', link, mdPath, file: foundPath });
      }
    }
  }

  return problems;
}

async function main() {
  const cwd = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const mdFiles = await findMdFiles(cwd);
  let totalProblems = 0;
  for (const f of mdFiles) {
    const p = await checkFile(f, cwd);
    if (p.length) {
      console.log(`\nIn ${path.relative(cwd, f)}:`);
      for (const prob of p) {
        totalProblems++;
        if (prob.type === 'missing-file') {
          console.log(`  ✖ broken link -> ${prob.link}`);
        } else if (prob.type === 'missing-anchor') {
          console.log(`  ✖ missing anchor ${prob.link} (target file: ${path.relative(cwd, prob.file)})`);
        }
      }
    }
  }

  if (totalProblems === 0) {
    console.log('\nNo broken Markdown references found.');
    process.exit(0);
  } else {
    console.log(`\nFound ${totalProblems} broken reference(s).`);
    process.exit(2);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
