import fs from 'node:fs';
import path from 'node:path';
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : /\.[jt]sx?$/.test(file) ? [file] : [];
  });
}
const files = [...walk('src'), ...walk('lib')];
const inventory = { tables: {}, rpcs: {}, buckets: {}, environment: {}, routes: [] };
const patterns = {
  tables: /\.from\(\s*['"]([^'"]+)['"](?:\s+as\s+\w+)?\s*\)/g,
  rpcs: /\.rpc\(\s*['"]([^'"]+)['"]/g,
  buckets: /\.storage\s*\.from\(\s*['"]([^'"]+)['"]/g,
  environment: /process\.env\.([A-Z][A-Z0-9_]+)/g,
};
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const constants = Object.fromEntries([...code.matchAll(/const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g)].map(match => [match[1], match[2]]));
  for (const match of code.matchAll(/(\.storage\s*)?\.from\(\s*(\w+)\s*\)/g)) {
    const name = constants[match[2]];
    if (!name) continue;
    const kind = match[1] ? 'buckets' : 'tables';
    inventory[kind][name] ??= [];
    if (!inventory[kind][name].includes(file)) inventory[kind][name].push(file);
  }
  for (const [kind, regex] of Object.entries(patterns)) {
    for (const match of code.matchAll(regex)) {
      inventory[kind][match[1]] ??= [];
      if (!inventory[kind][match[1]].includes(file)) inventory[kind][match[1]].push(file);
    }
  }
  if (/\/(page|route)\.tsx?$/.test(file)) inventory.routes.push(file);
}
// Storage .from() calls are not PostgreSQL tables.
for (const name of Object.keys(inventory.buckets)) delete inventory.tables[name];
inventory.notes = [
  'Static inventory only; dynamic table/RPC/bucket names, embedded relationships and SQL dependencies require catalog review.',
  'No source customer records, credentials, users, storage objects or operational migrations are included.',
];
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/dependency-inventory.json', JSON.stringify(inventory, null, 2) + '\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(inventory).filter(([key]) => key !== 'notes').map(([key, value]) => [key, Object.keys(value).length]))));
