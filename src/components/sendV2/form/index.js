/* istanbul ignore file */
import { connect } from 'react-redux';
import { translate } from 'react-i18next';

import Form from './form';

const mapStateToProps = state => ({
  followedAccounts: state.followedAccounts.accounts,
});

export default connect(mapStateToProps)(translate()(Form));
