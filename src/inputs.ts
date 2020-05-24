import * as core from '@actions/core';

const distributionTypes = ['key', 'name'] as const;
export type DistributionType = typeof distributionTypes[number];

export interface DistributionOptions {
  findBy: DistributionType;
  value: string;
  releaseNote: string;
}

export interface Options {
  apiToken: string;
  appOwnerName: string;
  appFilePath: string;
  message: string;
  pin: boolean;
  disableIOSNotification: boolean;
  visible: boolean;
  distribution?: DistributionOptions;
  ignoreApiFailure: boolean;
}

export const parseBooleanInput: (input: string, options: { defaultValue: boolean }) => boolean = (
  input,
  { defaultValue },
) => {
  return input === '' ? defaultValue : input === 'true' || input === 'yes' || input === 'y';
};

export const parseInputs: () => Promise<Options> = async () => {
  // Required options
  const apiToken = core.getInput('api_token', { required: true });
  const appOwnerName = core.getInput('app_owner_name', { required: true });
  const appFilePath = core.getInput('app_file_path', { required: true });

  const pin = parseBooleanInput(core.getInput('pin'), { defaultValue: false });
  const disableIOSNotification = parseBooleanInput(core.getInput('disable_notification'), { defaultValue: false });
  const visible = parseBooleanInput(core.getInput('public'), { defaultValue: false });
  const ignoreApiFailure = parseBooleanInput(core.getInput('ignore_api_failure'), { defaultValue: false });

  // Distribution options
  const rawDistributionFindBy: DistributionType | string = core.getInput('distribution_find_by');
  const findBy: DistributionType | null = distributionTypes.includes(rawDistributionFindBy as DistributionType)
    ? (rawDistributionFindBy as DistributionType)
    : null;
  const distributionValue = core.getInput('distribution_id');
  const releaseNote = core.getInput('release_note');
  const distribution = findBy && distributionValue ? { findBy, value: distributionValue, releaseNote } : undefined;

  // Otherwise
  const message = core.getInput('message');

  return {
    apiToken,
    appOwnerName,
    appFilePath,
    message,
    pin,
    disableIOSNotification,
    visible,
    distribution,
    releaseNote,
    ignoreApiFailure,
  };
};
