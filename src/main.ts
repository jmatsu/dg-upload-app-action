import * as core from '@actions/core';
import * as fs from 'fs';
import * as tmp from 'tmp';

import { parseInputs } from './inputs';
import { Outputs } from './outputs';
import { createClient, UploadOptions } from './deploygate/client';
import { sleep } from './sleep';
import { UploadResponse } from './deploygate/upload_response';

(async () => {
  try {
    const options = await parseInputs();

    core.debug('the current inputs:');
    core.debug(
      JSON.stringify({
        ...options,
        apiToken: 'masked',
        appOwnerName: 'masked',
      }),
    );

    const baseURL = `${process.env['DEPLOYGATE_API_ENDPOINT'] || 'https://deploygate.com'}/api/`;

    core.debug(`${baseURL} will be used`);

    const client = createClient({
      baseURL,
      token: options.apiToken,
    });

    const uploadOptions: UploadOptions = {
      disableIOSNotification: options.disableIOSNotification,
      message: options.message,
      visibility: options.visible ? 'public' : 'private',
    };

    core.debug('upload options has been built:');
    core.debug(JSON.stringify(uploadOptions));

    const uploadResponse = await client.upload(options.appOwnerName, options.appFilePath, uploadOptions);

    core.debug('got a response of upload api:');
    core.info(JSON.stringify(uploadResponse));

    const tmpFile = tmp.fileSync({ prefix: 'deploygate-action-', postfix: '.json', keep: true });

    fs.writeFileSync(tmpFile.name, JSON.stringify(uploadResponse));

    let outputs: Outputs = {
      response_json_path: tmpFile.name, // eslint-disable-line @typescript-eslint/camelcase
      pinned: false,
      uploaded: false,
    };

    const isUploadSuccessful = !uploadResponse.error;
    let isPinSuccessful = !options.pin;

    if (isUploadSuccessful) {
      core.info('uploaded successfully');

      const app = (uploadResponse as UploadResponse).results;

      outputs = {
        ...outputs,
        uploaded: true,
        package_name: app.package_name, // eslint-disable-line @typescript-eslint/camelcase
        download_url: app.file, // eslint-disable-line @typescript-eslint/camelcase
      };

      if (app.distribution) {
        outputs = {
          ...outputs,
          distribution_key: app.distribution.access_key, // eslint-disable-line @typescript-eslint/camelcase
          distribution_url: app.distribution.url, // eslint-disable-line @typescript-eslint/camelcase
        };
      }

      if (options.pin) {
        core.debug(`pin option is enabled so this action will try to pin the revision (${app.revision})`);

        sleep(5 * 1000); // the server will return 404 response while processing so wait for a sec.

        const pinResponse = await client.pin(options.appOwnerName, app.os_name, app.package_name, app.revision);

        isPinSuccessful = !pinResponse.error;

        core.debug('got a response of pin api:');
        core.info(JSON.stringify(pinResponse));

        if (isPinSuccessful) {
          core.info('pinned successfully');

          outputs = {
            ...outputs,
            pinned: true,
          };
        }
      } else {
        core.debug('pin option is disabled');
      }
    }

    for (const key of Object.keys(outputs)) {
      // round to null
      const value = (outputs as any)[key] || null; // eslint-disable-line @typescript-eslint/no-explicit-any
      core.debug(`Output: ${key} => ${value}`);
      core.setOutput(key, value);
    }

    if (!isUploadSuccessful || !isPinSuccessful) {
      const metadata = JSON.stringify({
        'upload has been successful': isUploadSuccessful,
        'pin has been successful': isPinSuccessful,
      });

      if (options.ignoreApiFailure) {
        core.warning(metadata);
        core.warning('got an error from the DeployGate server but this will not fail');
      } else {
        core.error(metadata);
        throw new Error('got an error from the DeployGate server');
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
