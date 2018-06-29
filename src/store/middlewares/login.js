import i18next from 'i18next';
import { getAccount } from '../../utils/api/account';
import { extractAddress, extractPublicKey } from '../../utils/account';
import { getDelegate } from '../../utils/api/delegate';
import { accountLoggedIn, accountLoading } from '../../actions/account';
import actionTypes from '../../constants/actions';
import accountConfig from '../../constants/account';
import { errorToastDisplayed } from '../../actions/toaster';

const { lockDuration } = accountConfig;
const loginMiddleware = store => next => (action) => {
  if (action.type !== actionTypes.activePeerSet || action.data.noSavedAccounts) {
    return next(action);
  }
  next(action);

  const { passphrase, options: { code } } = action.data;
  const publicKey = passphrase ? extractPublicKey(passphrase) : action.data.publicKey;
  const address = extractAddress(publicKey);
  const accountBasics = {
    passphrase,
    publicKey,
    address,
    network: code,
  };
  const { activePeer } = action.data;

  store.dispatch(accountLoading());

  // redirect to main/transactions
  return getAccount(activePeer, address).then((accountData) => {
    const duration = (passphrase && store.getState().settings.autoLog) ?
      Date.now() + lockDuration : 0;
    return getDelegate(activePeer, { publicKey })
      .then((delegateData) => {
        let accountUpdated = {
          ...accountData,
          ...accountBasics,
          delegate: {},
        };
        if (delegateData.data.length > 0) {
          accountUpdated = {
            ...accountUpdated,
            ...{ delegate: delegateData.data[0], isDelegate: true, expireTime: duration },
          };
        }
        store.dispatch(accountLoggedIn(accountUpdated));
      });
  }).catch(() => store.dispatch(errorToastDisplayed({ label: i18next.t('Unable to connect to the node') })));
};

export default loginMiddleware;
