import { HTTP_CODES, tokenMap, regex } from '@constants';
import http from '../http';
import ws from '../ws';
import { isEmpty } from '../../helpers';
import { extractAddressFromPublicKey, extractPublicKey } from '../../account';

const httpPrefix = '/api/v2';

const httpPaths = {
  account: `${httpPrefix}/accounts`,
  accounts: `${httpPrefix}/accounts`,
};

const wsMethods = {
  accounts: 'get.accounts',
  account: 'get.accounts',
};

/**
 * Prioritizes the API params and if passed, converts
 * publicKey and passphrase to address.
 *
 * @param {Object} params
 * @param {String?} params.username Valid delegate username
 * @param {String?} params.address Valid Lisk Address
 * @param {String?} params.passphrase Valid Mnemonic passphrase
 * @param {String?} params.publicKey Valid Lisk PublicKey
 *
 * @returns {Object} Params containing either address or username
 */
const getAccountParams = (params) => {
  if (!params || isEmpty(params)) return {};
  const {
    username,
    address,
    passphrase,
    publicKey,
  } = params;

  if (username) return { username };
  if (publicKey) return { publicKey };
  if (address) return { address };
  if (passphrase) {
    return { publicKey: extractPublicKey(passphrase) };
  }

  return {};
};

/**
 * Retrieves details of an account with given params
 *
 * @param {Object} data
 * @param {Object} data.network The network config from the Redux store
 * @param {String?} data.baseUrl Custom API URL
 * @param {Object} data.params
 * @param {String?} data.params.username Valid delegate username
 * @param {String?} data.params.address Valid Lisk Address
 * @param {String?} data.params.passphrase Valid Mnemonic passphrase
 * @param {String?} data.params.publicKey Valid Lisk PublicKey
 *
 * @returns {Promise}
 */
// eslint-disable-next-line complexity, max-statements
export const getAccount = async ({
  network, params, baseUrl,
}) => {
  const normParams = getAccountParams(params);

  try {
    const response = await http({
      baseUrl,
      path: httpPaths.account,
      network,
      params: normParams,
    });

    if (response.data[0]) {
      const account = { ...response.data[0] };
      if (params.publicKey) {
        account.summary.publicKey = params.publicKey;
        account.summary.privateKey = params.privateKey;
      }
      return account;
    }
  } catch (e) {
    if (e.code === HTTP_CODES.NOT_FOUND) {
      // eslint-disable-next-line no-console
      console.log('Lisk account not found.');

      if (params.publicKey) {
        const address = extractAddressFromPublicKey(params.publicKey);
        const account = {
          summary: {
            publicKey: params.publicKey,
            privateKey: params.privateKey,
            balance: 0,
            address,
            token: tokenMap.LSK.key,
          },
          sequence: {
            nonce: 0,
          },
        };
        return account;
      }
    } else {
      throw Error(e);
    }
  }
  throw Error('Error retrieving account');
};

const accountFilters = {
  limit: { key: 'limit', test: num => (typeof num === 'number') },
  offset: { key: 'offset', test: num => (typeof num === 'number' && num > 0) },
  sort: {
    key: 'sort',
    test: str => ['balance:asc', 'balance:desc'].includes(str),
  },
};

const getRequests = (values, isDelegate) => {
  const paramList = values.find(item => Array.isArray(item.list) && item.list.length);
  if (paramList) {
    return paramList.list
      .filter(item => regex[paramList.name].test(item))
      .map((item) => {
        const params = isDelegate
          ? {
            [paramList.name]: item,
            isDelegate: true,
          } : {
            [paramList.name]: item,
          };
        return {
          method: wsMethods.accounts,
          params,
          jsonrpc: '2.0',
        };
      });
  }
  return false;
};

/**
 * Retrieves the list of accounts with given params
 *
 * @param {Object} data
 * @param {Object} data.network The network config from the Redux store
 * @param {String?} data.baseUrl Custom API URL
 * @param {Object} data.params
 * @param {String?} data.params.usernameList Valid delegate username
 * @param {String?} data.params.addressList Valid Lisk Address
 * @param {String?} data.params.publicKeyList Valid Lisk PublicKey
 * @param {String?} data.params.limit Used for pagination
 * @param {String?} data.params.offset Used for pagination
 * @param {String?} data.params.sort  an option of 'balance:asc' and 'balance:desc',
 *
 * @returns {Promise}
 */
export const getAccounts = async ({
  network,
  params = {},
  baseUrl,
}) => {
  // Use websocket to retrieve accounts with a given array of addresses
  const requests = getRequests([
    { name: 'address', list: params.addressList },
    { name: 'publicKey', list: params.publicKeyList },
    { name: 'username', list: params.usernameList },
  ], params.isDelegate);
  if (requests.length) {
    return ws({
      requests,
      baseUrl: baseUrl || network.networks.LSK.serviceUrl,
    });
  }

  // Use HTTP to retrieve accounts with given sorting and pagination parameters
  const normParams = {};
  Object.keys(params).forEach((key) => {
    if (accountFilters[key] && accountFilters[key].test(params[key])) {
      normParams[accountFilters[key].key] = params[key];
    }
  });

  return http({
    path: httpPaths.accounts,
    network,
    baseUrl,
    params: normParams,
  });
};
