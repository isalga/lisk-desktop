import * as delegate from './index';
import http from '../http';
import ws from '../ws';

jest.mock('../http');
jest.mock('../ws');

const setApiResponseData = (data, api) => {
  api.mockImplementation(() => Promise.resolve(data));
};
const setApiRejection = (statusText, api) => {
  api.mockImplementation(() => Promise.reject(new Error(statusText)));
};
const resetApiMock = () => {
  http.mockClear();
  ws.mockClear();
};

describe('API delegate module', () => {
  const baseUrl = 'http://baseurl.io';
  const network = { serviceUrl: 'http://testnet.io' };

  describe('getDelegate', () => {
    beforeEach(() => {
      resetApiMock();
    });

    it('should return a promise', async () => {
      const delegatePromise = delegate.getDelegate({});
      expect(typeof delegatePromise.then).toEqual('function');
      expect(typeof delegatePromise.catch).toEqual('function');
    });

    it('should reject promise if conflicting parameters are supplied', async () => {
      const data = {
        address: '1L', publicKey: 'abcd1', username: 'del1', network,
      };
      await expect(delegate.getDelegate({ ...data })).rejects.toThrow('conflicting parameters');
    });

    it('should return delegate data', async () => {
      const expectedResponse = { address: '1L', username: 'del1', data: {} };
      const data = { address: '1L', network };
      setApiResponseData(expectedResponse, http);
      await expect(delegate.getDelegate({ ...data })).resolves.toEqual(expectedResponse);
      expect(http).toHaveBeenCalledWith({
        baseUrl: undefined,
        path: delegate.ENDPOINTS.DELEGATES,
        params: { address: '1L' },
        network,
      });
    });

    it('should set baseUrl', () => {
      const params = { address: '1L' };
      delegate.getDelegate({ ...params, baseUrl, network });
      expect(http).toHaveBeenCalledWith({
        baseUrl,
        path: delegate.ENDPOINTS.DELEGATES,
        params,
        network,
      });
    });

    it('should throw when api fails', async () => {
      const expectedResponse = new Error('API call could not be completed');
      const data = { address: '1L' };
      setApiRejection(expectedResponse.message, http);
      await expect(delegate.getDelegate({ ...data })).rejects.toEqual(expectedResponse);
    });
  });

  describe('getDelegates', () => {
    const addressList = ['1L', '2L'];
    const publicKeyList = ['abcd1', 'bad2'];
    const usernameList = ['del1', 'del2'];

    beforeEach(() => {
      resetApiMock();
    });

    it('should return a promise', async () => {
      const delegatePromise = delegate.getDelegates({});
      expect(typeof delegatePromise.then).toEqual('function');
      expect(typeof delegatePromise.catch).toEqual('function');
    });

    it('should reject promise if conflicting parameters are supplied', async () => {
      const data = { addressList, publicKeyList, usernameList };
      await expect(delegate.getDelegates({ ...data })).rejects.toThrow('conflicting parameters');
    });

    it('should ignore filtering parameters and call through websocket', async () => {
      await delegate.getDelegates({
        addressList, limit: 5, offset: 3,
      });
      expect(ws).toHaveBeenCalledWith({
        baseUrl: undefined,
        requests: { params: { addressList }, method: delegate.WS_METHODS.GET_DELEGATES },
      });
    });

    it('should return delegates list when addressList is passed and call through websocket', async () => {
      const expectedResponse = [{}, {}, {}];
      const data = { addressList };
      setApiResponseData(expectedResponse, ws);
      await expect(delegate.getDelegates({ ...data })).resolves.toEqual(expectedResponse);
      expect(http).not.toHaveBeenCalled();
      expect(ws).toHaveBeenCalledWith({
        baseUrl: undefined,
        requests: { params: { addressList }, method: delegate.WS_METHODS.GET_DELEGATES },
      });
    });

    it('should return delegates list when filters are passed and call through http', async () => {
      const expectedResponse = [{}, {}, {}];
      setApiResponseData(expectedResponse, http);
      await expect(
        delegate.getDelegates({ limit: 10, offset: 0, network }),
      ).resolves.toEqual(expectedResponse);
      expect(ws).not.toHaveBeenCalled();
      expect(http).toHaveBeenCalledWith({
        baseUrl: undefined,
        path: delegate.ENDPOINTS.DELEGATES,
        params: { limit: 10, offset: 0 },
        network,
      });
    });

    it('should set baseUrl', () => {
      delegate.getDelegates({ addressList, baseUrl });
      expect(ws).toHaveBeenCalledWith({
        baseUrl,
        requests: { params: { addressList }, method: delegate.WS_METHODS.GET_DELEGATES },
      });
      delegate.getDelegates({
        limit: 10, offset: 0, baseUrl, network,
      });
      expect(http).toHaveBeenCalledWith({
        baseUrl,
        path: delegate.ENDPOINTS.DELEGATES,
        params: { limit: 10, offset: 0 },
        network,
      });
    });

    it('should throw when api fails', async () => {
      const expectedResponse = new Error('API call could not be completed');
      setApiRejection(expectedResponse.message, http);
      setApiRejection(expectedResponse.message, ws);
      await expect(
        delegate.getDelegates({ addressList }),
      ).rejects.toEqual(expectedResponse);
      await expect(
        delegate.getDelegates({ limit: 10, offset: 0 }),
      ).rejects.toEqual(expectedResponse);
    });
  });

  describe('getVotes', () => {
    const address = '1L';
    const publicKey = 'abcd1';

    beforeEach(() => {
      resetApiMock();
    });

    it('should return a promise', async () => {
      const delegatePromise = delegate.getVotes({});
      expect(typeof delegatePromise.then).toEqual('function');
      expect(typeof delegatePromise.catch).toEqual('function');
    });

    it('should reject promise if conflicting parameters are supplied', async () => {
      const data = { address, publicKey };
      await expect(delegate.getVotes({ ...data })).rejects.toThrow('conflicting parameters');
    });

    it('should return votes list when address is passed', async () => {
      const expectedResponse = [{}, {}, {}];
      const params = { address };
      setApiResponseData(expectedResponse, http);
      await expect(delegate.getVotes({ ...params, network })).resolves.toEqual(expectedResponse);
      expect(http).toHaveBeenCalledWith({
        baseUrl: undefined,
        path: delegate.ENDPOINTS.VOTES_SENT,
        params,
        network,
      });
    });

    it('should set baseUrl', () => {
      const params = { address };
      delegate.getVotes({ ...params, network, baseUrl });
      expect(http).toHaveBeenCalledWith({
        baseUrl,
        path: delegate.ENDPOINTS.VOTES_SENT,
        params,
        network,
      });
    });

    it('should throw when api fails', async () => {
      const expectedResponse = new Error('API call could not be completed');
      setApiRejection(expectedResponse.message, http);
      await expect(
        delegate.getVotes({ address }),
      ).rejects.toEqual(expectedResponse);
    });
  });

  describe('getVoters', () => {
    const address = '1L';
    const publicKey = 'abcd1';

    beforeEach(() => {
      resetApiMock();
    });

    it('should return a promise', async () => {
      const delegatePromise = delegate.getVoters({});
      expect(typeof delegatePromise.then).toEqual('function');
      expect(typeof delegatePromise.catch).toEqual('function');
    });

    it('should reject promise if conflicting parameters are supplied', async () => {
      const data = { address, publicKey };
      await expect(delegate.getVoters({ ...data })).rejects.toThrow('conflicting parameters');
    });

    it('should return votes list when address is passed', async () => {
      const expectedResponse = [{}, {}, {}];
      const params = { address };
      setApiResponseData(expectedResponse, http);
      await expect(delegate.getVoters({ ...params, network })).resolves.toEqual(expectedResponse);
      expect(http).toHaveBeenCalledWith({
        baseUrl: undefined,
        path: delegate.ENDPOINTS.VOTES_RECEIVED,
        params,
        network,
      });
    });

    it('should return votes list when address, filters and baseURL are passed', async () => {
      const expectedResponse = [{}, {}, {}];
      const params = {
        address, limit: 3, offset: 2,
      };
      setApiResponseData(expectedResponse, http);
      await expect(
        delegate.getVoters({ ...params, baseUrl, network }),
      ).resolves.toEqual(expectedResponse);
      expect(http).toHaveBeenCalledWith({
        baseUrl,
        path: delegate.ENDPOINTS.VOTES_RECEIVED,
        params,
        network,
      });
    });

    it('should set baseUrl', () => {
      const params = {
        address, limit: 3, offset: 2,
      };
      delegate.getVoters({ ...params, baseUrl, network });
      expect(http).toHaveBeenCalledWith({
        baseUrl,
        path: delegate.ENDPOINTS.VOTES_RECEIVED,
        params,
        network,
      });
    });

    it('should throw when api fails', async () => {
      const expectedResponse = new Error('API call could not be completed');
      setApiRejection(expectedResponse.message, http);
      await expect(
        delegate.getVoters({ address }),
      ).rejects.toEqual(expectedResponse);
    });
  });

  describe('getForgers', () => {
    beforeEach(() => {
      resetApiMock();
    });

    it('should return a promise', async () => {
      const delegatePromise = delegate.getForgers({});
      expect(typeof delegatePromise.then).toEqual('function');
      expect(typeof delegatePromise.catch).toEqual('function');
    });

    it('should return forgers list', async () => {
      const expectedResponse = [{}, {}, {}];
      setApiResponseData(expectedResponse, http);
      await expect(
        delegate.getForgers({ limit: 5, offset: 0, network }),
      ).resolves.toEqual(expectedResponse);
      expect(http).toHaveBeenCalledWith({
        baseUrl: undefined,
        path: delegate.ENDPOINTS.FORGERS,
        params: { limit: 5, offset: 0 },
        network,
      });
    });

    it('should set baseUrl', () => {
      delegate.getForgers({
        limit: 5, offset: 0, baseUrl, network,
      });
      expect(http).toHaveBeenCalledWith({
        baseUrl,
        path: delegate.ENDPOINTS.FORGERS,
        params: { limit: 5, offset: 0 },
        network,
      });
    });

    it('should throw when api fails', async () => {
      const expectedResponse = new Error('API call could not be completed');
      setApiRejection(expectedResponse.message, http);
      await expect(
        delegate.getForgers({ limit: 5, offset: 0 }),
      ).rejects.toEqual(expectedResponse);
    });
  });
});
