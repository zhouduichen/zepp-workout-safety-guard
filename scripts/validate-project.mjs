import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

let exitCode = 0;

function fail(message) {
  console.error(`FAIL: ${message}`);
  exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

// ---------------------------------------------------------------------------
// 1. app.json checks
// ---------------------------------------------------------------------------
const appJsonPath = resolve(projectRoot, 'app.json');
if (!existsSync(appJsonPath)) {
  fail('app.json not found');
} else {
  try {
    const raw = readFileSync(appJsonPath, 'utf-8');
    const config = JSON.parse(raw);
    pass('app.json is valid JSON');

    // appId
    if (config.app && typeof config.app.appId === 'number') {
      pass(`appId is present: ${config.app.appId}`);
    } else {
      fail('appId is missing or not a number');
    }

    // Pages
    const pages = config.targets?.gt?.module?.page?.pages;
    if (pages && Array.isArray(pages) && pages.length > 0) {
      pass(`pages list has ${pages.length} entry(ies)`);
    } else {
      fail('pages list is empty or missing');
    }

    // Permissions
    const permissions = config.permissions;
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      pass(`permissions list has ${permissions.length} entry(ies)`);
      if (permissions.includes('device:os.bg_service')) {
        pass('background service permission declared');
      } else {
        fail('device:os.bg_service permission is missing');
      }
    } else {
      fail('permissions list is empty or missing');
    }

    // App Service
    const appService = config.targets?.gt?.module?.['app-service'];
    if (appService && appService.services && Array.isArray(appService.services) && appService.services.length > 0) {
      pass(`app-service has ${appService.services.length} service(s)`);
    } else {
      fail('app-service.services is missing or empty');
    }

    // Forbidden permissions (high-power sensors in App Service)
    if (permissions && Array.isArray(permissions)) {
      const forbidden = ['device:sensor.accelerometer', 'device:sensor.gyroscope', 'data:os.location'];
      for (const f of forbidden) {
        if (permissions.includes(f)) {
          fail(`forbidden permission in app.json: ${f} (App Service cannot use high-power sensors)`);
        }
      }
    }
  } catch (e) {
    fail(`app.json is not valid JSON: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// 2. Default config safety checks
// ---------------------------------------------------------------------------
const configPath = resolve(projectRoot, 'src', 'domain', 'default-config.js');
if (existsSync(configPath)) {
  const configContent = readFileSync(configPath, 'utf-8');
  if (configContent.includes('autoContactDispatch: false')) {
    pass('default config has autoContactDispatch: false');
  } else {
    fail('default config must have autoContactDispatch: false');
  }
  if (configContent.includes("dispatcherMode: 'demo'") || configContent.includes('dispatcherMode: "demo"')) {
    pass('default config has dispatcherMode: demo');
  } else {
    fail('default config must have dispatcherMode: demo');
  }
}

// ---------------------------------------------------------------------------
// 3. Marketing-phrase scan in source files
// ---------------------------------------------------------------------------
const forbiddenPhrases = [
  'cardiac.arrest', 'fall.detect', 'guaranteed.rescue', 'sudden.death',
  '心脏骤停', '跌倒检测', '猝死',
];

const sourceDirs = ['app.js', 'app-service', 'app-side', 'secondary-widget', 'setting', 'page', 'src'];
const excludeDirs = ['docs', 'test', 'node_modules', 'dist', 'spikes'];

function shouldScan(name) {
  if (excludeDirs.includes(name)) return false;
  if (name.startsWith('.')) return false;
  return true;
}

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = resolve(filePath).substring(projectRoot.length + 1);
    for (const phrase of forbiddenPhrases) {
      const regex = new RegExp(phrase.replace(/\./g, '\\.'), 'i');
      if (regex.test(content)) {
        // Skip if the phrase is used in a denial context ("不能检测", "cannot detect", "不会", etc.)
        const denialPatterns = [
          new RegExp(`不能检测${phrase.replace(/\./g, '\\.')}`, 'i'),
          new RegExp(`cannot detect.*${phrase.replace(/\./g, '\\.')}`, 'i'),
          new RegExp(`not.*${phrase.replace(/\./g, '\\.')}`, 'i'),
          new RegExp(`不会${phrase.replace(/\./g, '\\.')}`, 'i'),
        ];
        const isDenied = denialPatterns.some(dp => dp.test(content));
        if (!isDenied) {
          fail(`forbidden phrase "${phrase}" found in ${relPath}`);
        }
      }
    }
  } catch {}
}

function scanDir(dirPath) {
  try {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      if (!shouldScan(entry)) continue;
      const fullPath = resolve(dirPath, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (stat.isFile() && /\.(js|mjs|ts)$/.test(entry)) {
        scanFile(fullPath);
      }
    }
  } catch {}
}

for (const name of sourceDirs) {
  const fullPath = resolve(projectRoot, name);
  if (existsSync(fullPath)) {
    const stat = statSync(fullPath);
    if (stat.isFile()) {
      scanFile(fullPath);
    } else if (stat.isDirectory()) {
      scanDir(fullPath);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Demo dispatcher check
// ---------------------------------------------------------------------------
const dispatcherPath = resolve(projectRoot, 'app-side', 'demo-dispatcher.js');
if (existsSync(dispatcherPath)) {
  const dispatcherContent = readFileSync(dispatcherPath, 'utf-8');
  if (dispatcherContent.includes('fetch')) {
    // Check if it's an actual import or call, not just a comment
    const fetchLines = dispatcherContent.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.includes('fetch') && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
    });
    if (fetchLines.length > 0) {
      fail('demo-dispatcher.js must not import or call fetch');
    }
  }
  if (/https?:\/\//.test(dispatcherContent)) {
    fail('demo-dispatcher.js must not contain production HTTP URLs');
  }
  pass('demo-dispatcher has no fetch or HTTP URLs');
}

// Summary
if (exitCode === 0) {
  console.log('\nvalidation passed');
} else {
  process.exit(exitCode);
}
