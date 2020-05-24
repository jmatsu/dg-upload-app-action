jest.mock('@actions/core');

import * as core from '@actions/core';

import { parseBooleanInput, parseInputs } from '../src/inputs';

type getInputType = (name: string) => string;

const mockGetInput = (core.getInput as unknown) as jest.Mock<string>;

describe('#parseBooleanInput', () => {
  it('should be the default value if empty string', () => {
    expect(parseBooleanInput('', { defaultValue: false })).toBeFalsy();
    expect(parseBooleanInput('', { defaultValue: true })).toBeTruthy();
  });

  it('should returns true if the input is either of true, yes, y', () => {
    expect(parseBooleanInput('true', { defaultValue: false })).toBeTruthy();
    expect(parseBooleanInput('yes', { defaultValue: false })).toBeTruthy();
    expect(parseBooleanInput('y', { defaultValue: false })).toBeTruthy();

    expect(parseBooleanInput('false', { defaultValue: true })).toBeFalsy();
    expect(parseBooleanInput('otherwrise', { defaultValue: true })).toBeFalsy();
  });
});

describe('#parseInputs', () => {
  beforeEach(() => {
    mockGetInput.mockImplementation((name: string) => name);
  });

  test('apiToken should be retrieved', async () => {
    expect((await parseInputs()).apiToken).toEqual('api_token');
  });

  test('appOwnerName should be retrieved', async () => {
    expect((await parseInputs()).appOwnerName).toEqual('app_owner_name');
  });

  test('appFilePath should be retrieved', async () => {
    expect((await parseInputs()).appFilePath).toEqual('app_file_path');
  });

  test('message should be retrieved', async () => {
    expect((await parseInputs()).message).toEqual('message');
  });

  test('pin should be true iff specified', async () => {
    const stubProvider: (name: string) => getInputType = (value: string) => {
      return (name: string) => {
        if (name === 'pin') {
          return value;
        } else {
          return name;
        }
      };
    };

    mockGetInput.mockImplementation(stubProvider('false'));

    expect((await parseInputs()).pin).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('dummy'));

    expect((await parseInputs()).pin).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('true'));

    expect((await parseInputs()).pin).toBeTruthy();
  });

  test('disableIOSNotification should be true iff specified', async () => {
    const stubProvider: (name: string) => getInputType = (value: string) => {
      return (name: string) => {
        if (name === 'disable_notification') {
          return value;
        } else {
          return name;
        }
      };
    };

    mockGetInput.mockImplementation(stubProvider('false'));

    expect((await parseInputs()).disableIOSNotification).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('dummy'));

    expect((await parseInputs()).disableIOSNotification).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('true'));

    expect((await parseInputs()).disableIOSNotification).toBeTruthy();
  });

  test('visibility should be public iff specified', async () => {
    const stubProvider: (name: string) => getInputType = (value: string) => {
      return (name: string) => {
        if (name === 'public') {
          return value;
        } else {
          return name;
        }
      };
    };

    mockGetInput.mockImplementation(stubProvider('false'));

    expect((await parseInputs()).visible).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('dummy'));

    expect((await parseInputs()).visible).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('true'));

    expect((await parseInputs()).visible).toBeTruthy();
  });

  test('distribution relies on distribution_find_by and distribution_id', async () => {
    const stubProvider: (findBy: string, value: string, releaseNote: string) => getInputType = (
      findBy,
      value,
      releaseNote,
    ) => {
      return (name: string) => {
        if (name === 'distribution_find_by') {
          return findBy;
        } else if (name === 'distribution_id') {
          return value;
        } else if (name == 'release_note') {
          return releaseNote;
        } else {
          return name;
        }
      };
    };

    mockGetInput.mockImplementation(stubProvider('key', 'distribution_id', 'release_note'));

    expect((await parseInputs()).distribution).toEqual({
      findBy: 'key',
      value: 'distribution_id',
      releaseNote: 'release_note',
    });

    mockGetInput.mockImplementation(stubProvider('name', 'distribution_id', ''));

    expect((await parseInputs()).distribution).toEqual({
      findBy: 'name',
      value: 'distribution_id',
      releaseNote: '',
    });

    mockGetInput.mockImplementation(stubProvider('dummy', 'distribution_id', 'release_note'));

    expect((await parseInputs()).distribution).toBeUndefined();

    mockGetInput.mockImplementation(stubProvider('', 'distribution_id', 'release_note'));

    expect((await parseInputs()).distribution).toBeUndefined();

    mockGetInput.mockImplementation(stubProvider('name', '', 'release_note'));

    expect((await parseInputs()).distribution).toBeUndefined();
  });

  test('exitWithApiStatus should be false iff specified', async () => {
    const stubProvider: (name: string) => getInputType = (value: string) => {
      return (name: string) => {
        if (name === 'ignore_api_failure') {
          return value;
        } else {
          return name;
        }
      };
    };

    mockGetInput.mockImplementation(stubProvider('false'));

    expect((await parseInputs()).ignoreApiFailure).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('dummy'));

    expect((await parseInputs()).ignoreApiFailure).toBeFalsy();

    mockGetInput.mockImplementation(stubProvider('true'));

    expect((await parseInputs()).ignoreApiFailure).toBeTruthy();
  });
});
