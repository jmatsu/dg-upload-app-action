export interface Response<T> {
  error: boolean;
  results: T;
}

export interface ErrorDetail {
  message: string;
}

export type ErrorResponse = Response<ErrorDetail>;
