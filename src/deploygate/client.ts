import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import fs from 'fs';

import { version } from '../version';
import { DistributionOptions } from '../inputs';
import { UploadResponse } from './upload_response';
import { PinResponse } from './pin_response';
import { Response, ErrorResponse } from './response';

const visibilities = ['public', 'private'] as const;
export type Visibility = typeof visibilities[number];

export interface ClientOptions {
  baseURL: string;
  token: string;
  debug?: boolean;
}

export interface UploadOptions {
  message: string;
  disableIOSNotification: boolean;
  visibility: Visibility;
  distribution?: DistributionOptions;
}

export interface Client {
  upload(appOwnerName: string, appFilePath: string, options: UploadOptions): Promise<UploadResponse | ErrorResponse>;
  pin(
    appOwnerName: string,
    osName: string,
    packageName: string,
    revision: number,
  ): Promise<PinResponse | ErrorResponse>;
}

type AxiosFactory = (baseURL: string, token: string) => AxiosInstance;

export const createAxiosInstance: AxiosFactory = (baseURL, token) => {
  return axios.create({
    baseURL,
    httpAgent: `dg-upload-app-action/${version} (GithubAction; jmatsu/dg-upload-app-action)`,
    timeout: 1000 * 60 * 5, // 5 minutes
    headers: {
      Authorization: `token ${token}`,
    },
    maxBodyLength: 5 * 1024 * 1024 * 1024,
    maxContentLength: 5 * 1024 * 1024 * 1024,
  });
};

async function normalizeResponse<T>(
  request: Promise<AxiosResponse<Response<T>>>,
): Promise<Response<T> | ErrorResponse> {
  try {
    const response = await request;

    if (response.data.error) {
      return (response.data as unknown) as ErrorResponse;
    } else {
      return response.data;
    }
  } catch (e) {
    if (e.response && e.response.data) {
      return (e.response.data as unknown) as ErrorResponse;
    }

    throw e;
  }
}

export const createClient: (options: ClientOptions) => Client = options => {
  const instance = createAxiosInstance(options.baseURL, options.token);

  if (options.debug) {
    instance.interceptors.request.use(request => {
      console.log(request); // eslint-disable-line no-console
      return request;
    });
  }

  return {
    upload: async (appOwnerName: string, appFilePath: string, uploadOptions: UploadOptions) => {
      const { message, disableIOSNotification, visibility, distribution } = uploadOptions;

      const form = new FormData();

      form.append('file', fs.createReadStream(appFilePath));

      if (message) {
        form.append('message', message);
      }

      if (disableIOSNotification) {
        form.append('disable_notify', 'true');
      }

      form.append('visibility', visibility);

      if (distribution) {
        if (distribution.findBy === 'key') {
          form.append('distribution_key', distribution.value);
        } else {
          form.append('distribution_name', distribution.value);
        }

        if (distribution.releaseNote) {
          form.append('release_note', distribution.releaseNote);
        }
      }

      const request = instance.post(`/users/${appOwnerName}/apps`, form, {
        headers: form.getHeaders(),
      });
      return normalizeResponse(request);
    },
    pin: async (appOwnerName: string, osName: string, packageName: string, revision: number) => {
      const request = instance.post(
        `/users/${appOwnerName}/platforms/${osName.toLowerCase()}/apps/${packageName}/binaries/${revision}/protect`,
        {},
      );
      return normalizeResponse(request);
    },
  };
};
