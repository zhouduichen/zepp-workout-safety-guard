import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
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

// 1. app.json must exist and be valid JSON
const appJsonPath = resolve(projectRoot, 'app.json');
if (!existsSync(appJsonPath)) {
  fail('app.json not found');
} else {
  try {
    const raw = readFileSync(appJsonPath, 'utf-8');
    const config = JSON.parse(raw);
    pass('app.json is valid JSON');

    // 2. appId must exist
    if (config.app && typeof config.app.appId === 'number') {
      pass(`appId is present: ${config.app.appId}`);
    } else {
      fail('appId is missing or not a number');
    }

    // 3. Page list must not be empty
    const pages = config.targets?.gt?.module?.page?.pages;
    if (pages && Array.isArray(pages) && pages.length > 0) {
      pass(`pages list has ${pages.length} entry(ies)`);
    } else {
      fail('pages list is empty or missing');
    }

    // 4. Check permissions
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

    // 5. App Service declaration
    const appService = config.targets?.gt?.module?.['app-service'];
    if (appService && appService.services && Array.isArray(appService.services) && appService.services.length > 0) {
      pass(`app-service has ${appService.services.length} service(s)`);
    } else {
      fail('app-service.services is missing or empty');
    }

    // 6. No forbidden permissions
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

// Summary
if (exitCode === 0) {
  console.log('\nvalidation passed');
} else {
  process.exit(exitCode);
}
