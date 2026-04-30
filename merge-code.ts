import * as fs from 'fs';
import * as path from 'path';

const srcPath = path.join(process.cwd(), 'src');
const outputFile = 'pcuwebadmin.txt';

// Remove old file if it exists
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

const VALID_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

const IGNORE_DIRS = ['node_modules', 'dist', 'build', '.next', 'coverage'];
const IGNORE_FILES = [
  '.test.',
  '.spec.',
  '.stories.',
  '.d.ts',
  'vite.config',
  'tailwind.config',
  'postcss.config',
  'jest.config',
  'next.config',
];

function shouldIgnore(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  if (IGNORE_DIRS.some((d) => normalized.includes(`/${d}/`))) return true;
  if (IGNORE_FILES.some((pattern) => normalized.includes(pattern))) return true;
  return false;
}

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const fullPath = path.join(dir, f);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    if (isDirectory) {
      if (!IGNORE_DIRS.includes(f)) {
        walkDir(fullPath, callback);
      }
    } else {
      const ext = path.extname(f);
      if (VALID_EXTENSIONS.includes(ext) && !shouldIgnore(fullPath)) {
        callback(fullPath);
      }
    }
  });
}

function extractComponentName(content: string): string[] {
  const patterns = [
    // Arrow function components: const MyComponent = () =>
    /(?:export\s+(?:default\s+)?)?const\s+([A-Z][A-Za-z0-9]*)\s*(?::\s*(?:React\.)?(?:FC|FunctionComponent|ReactNode)[^=]*)?\s*=\s*(?:\([^)]*\)|[A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=]*)?\s*=>/g,
    // Function declaration components: function MyComponent() / export default function MyComponent()
    /(?:export\s+(?:default\s+)?)?function\s+([A-Z][A-Za-z0-9]*)\s*\(/g,
    // Class components: class MyComponent extends React.Component
    /class\s+([A-Z][A-Za-z0-9]*)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/g,
  ];

  const found = new Set<string>();
  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      found.add(match[1]);
    }
  }
  return [...found];
}

function extractImports(content: string): string[] {
  const importRegex = /^import\s+.+\s+from\s+['"].+['"]/gm;
  return content.match(importRegex) || [];
}

function extractHooks(content: string): string[] {
  const hookRegex = /\buse[A-Z][A-Za-z0-9]*\b/g;
  const allHooks = content.match(hookRegex) || [];
  return [...new Set(allHooks)]; // deduplicate
}

function extractRoutes(content: string): string[] {
  // React Router: <Route path="..." /> or <Route path='...'
  const routeRegex = /<Route[^>]+path=['"]([^'"]+)['"]/g;
  const routes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = routeRegex.exec(content)) !== null) {
    routes.push(match[1]);
  }
  return routes;
}

function extractApiCalls(content: string): string[] {
  const patterns = [
    // axios.get('/api/...'), axios.post('/api/...')
    /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // fetch('/api/...')
    /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // api.get('/...'), api.post('/...')
    /api\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];

  const found = new Set<string>();
  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      found.add(match[1]);
    }
  }
  return [...found];
}

const writeStream = fs.createWriteStream(outputFile, { flags: 'a' });

walkDir(srcPath, (filePath) => {
  const relativePath = path.relative(srcPath, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  const components = extractComponentName(content);
  const imports = extractImports(content);
  const hooks = extractHooks(content);
  const routes = extractRoutes(content);
  const apiCalls = extractApiCalls(content);

  writeStream.write(`\n========================================\n`);
  writeStream.write(`FILE: ${relativePath}\n`);
  writeStream.write(`========================================\n\n`);

  if (components.length) {
    writeStream.write(`COMPONENTS:\n`);
    components.forEach((c) => writeStream.write(` - ${c}\n`));
    writeStream.write(`\n`);
  }

  if (hooks.length) {
    writeStream.write(`HOOKS USED:\n`);
    hooks.forEach((h) => writeStream.write(` - ${h}\n`));
    writeStream.write(`\n`);
  }

  if (routes.length) {
    writeStream.write(`ROUTES DEFINED:\n`);
    routes.forEach((r) => writeStream.write(` - ${r}\n`));
    writeStream.write(`\n`);
  }

  if (apiCalls.length) {
    writeStream.write(`API CALLS:\n`);
    apiCalls.forEach((a) => writeStream.write(` - ${a}\n`));
    writeStream.write(`\n`);
  }

  if (imports.length) {
    writeStream.write(`IMPORTS:\n`);
    imports.forEach((i) => writeStream.write(` - ${i}\n`));
    writeStream.write(`\n`);
  }

  writeStream.write(`CONTENT:\n\n`);
  writeStream.write(content);
  writeStream.write(`\n`);
});

writeStream.end(() => {
  console.log(`Extraction complete: ${outputFile}`);
});