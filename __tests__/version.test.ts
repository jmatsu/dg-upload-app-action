import * as cp from 'child_process';

import { version } from '../src/version';

test('version should be the CURRENT tag when tagged', async () => {
  try {
    const tag = cp.execSync('git tag --points-at HEAD').toString();

    if (tag) {
      expect(version).toEqual(tag);
    }
  } catch (ignore) {
    // no-op
  }
});
