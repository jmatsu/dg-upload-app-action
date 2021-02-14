import * as cp from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as process from 'process';

// These test cases should exec main.js as the same as what GitHub Action does.
// Require `build`
const ip = path.join(__dirname, '..', 'lib', 'main.js');

const runAction: (options: { expectSuccess: boolean }) => string = ({ expectSuccess }) => {
  const options: cp.ExecSyncOptions = {
    env: process.env,
  };

  try {
    const stdout = cp.execFileSync(process.execPath, [ip], options).toString();

    if (!expectSuccess) {
      console.log('unexpected successful exec', stdout);
    }
    expect(expectSuccess).toBeTruthy();

    return stdout;
  } catch (e) {
    if (expectSuccess) {
      console.log('unexpected failure exec', e, e.stdout.toString(), e.stderr.toString());
    }
    expect(expectSuccess).toBeFalsy();

    return e.stderr;
  }
};

beforeEach(() => {
  process.env['INPUT_APP_FILE_PATH'] = '';
  process.env['INPUT_IGNORE_API_FAILURE'] = '';
  process.env['INPUT_PIN'] = '';

  const injections = dotenv.config({ path: path.join(__dirname, './.env') }).parsed;

  if (injections) {
    for (const key of Object.keys(injections)) {
      process.env[key] = injections[key];
    }
  } else {
    throw './.env has error';
  }
});

it('runAction should fail if ignoreApiFailure is not true', () => {
  process.env['INPUT_APP_FILE_PATH'] = path.join(__dirname, '..', 'fixtures', 'DeployGateSample.apk');
  process.env['INPUT_API_TOKEN'] = 'dummy';
  process.env['INPUT_IGNORE_API_FAILURE'] = 'false';

  runAction({ expectSuccess: false });
});

it('runAction should not fail if ignoreApiFailure is true', () => {
  process.env['INPUT_APP_FILE_PATH'] = path.join(__dirname, '..', 'fixtures', 'DeployGateSample.apk');
  process.env['INPUT_API_TOKEN'] = 'dummy';
  process.env['INPUT_IGNORE_API_FAILURE'] = 'true';

  runAction({ expectSuccess: true });
});

it('runAction should fail even if ignoreApiFailure is true when non-api related error happens', () => {
  process.env['INPUT_APP_FILE_PATH'] = ''; // missing requires inputs
  process.env['INPUT_API_TOKEN'] = 'dummy';
  process.env['INPUT_IGNORE_API_FAILURE'] = 'true';

  runAction({ expectSuccess: false });
});

it('apk upload should succeed with the minimum options', () => {
  process.env['INPUT_APP_FILE_PATH'] = path.join(__dirname, '..', 'fixtures', 'DeployGateSample.apk');

  const outputs = runAction({ expectSuccess: true });

  expect(outputs.includes('uploaded successfully')).toBeTruthy();
});

// this fails if the keystore has not been generated yet
it('aab upload should succeed with the minimum options', () => {
  process.env['INPUT_APP_FILE_PATH'] = path.join(__dirname, '..', 'fixtures', 'DeployGateSample.aab');

  const outputs = runAction({ expectSuccess: true });

  expect(outputs.includes('uploaded successfully')).toBeTruthy();
});

it('ipa upload should succeed with the minimum options', () => {
  process.env['INPUT_APP_FILE_PATH'] = path.join(__dirname, '..', 'fixtures', 'DeployGateSample.ipa');

  const outputs = runAction({ expectSuccess: true });

  expect(outputs.includes('uploaded successfully')).toBeTruthy();
});

it('apk upload and pin it should succeed', () => {
  process.env['INPUT_APP_FILE_PATH'] = path.join(__dirname, '..', 'fixtures', 'DeployGateSample.apk');
  process.env['INPUT_PIN'] = 'true';

  const outputs = runAction({ expectSuccess: true });

  expect(outputs.includes('uploaded successfully')).toBeTruthy();
  expect(outputs.includes('pinned successfully')).toBeTruthy();
});
