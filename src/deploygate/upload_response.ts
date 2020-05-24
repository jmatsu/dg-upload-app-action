import { Response } from './response';

export interface User {
  id: number;
  name: string;
  profile_icon: string;
}

export interface Distribution {
  access_key: string;
  url: string;
}

export interface Application {
  name: string;
  package_name: string;
  os_name: string;
  path: string;
  version_code: string;
  version_name: string;
  sdk_version: number;
  raw_sdk_version: string;
  target_sdk_version: number;
  signature: string;
  md5: string;
  revision: number;
  file_size: number;
  message: string;
  file: string;
  icon: string;
  user: User;
  distribution?: Distribution;
}

export type UploadResponse = Response<Application>;
