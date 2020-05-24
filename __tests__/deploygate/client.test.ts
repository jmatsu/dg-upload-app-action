import { createAxiosInstance } from '../../src/deploygate/client';

describe('#createAxiosInstance', () => {
  it('should create the axios instance', () => {
    const instance = createAxiosInstance('baseURL', 'dummyToken');

    expect(instance.defaults.baseURL).toEqual('baseURL');
    expect(instance.defaults.headers['Authorization']).toEqual('token dummyToken');
  });
});
