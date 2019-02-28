// eslint-disable-line max-lines
import React from 'react';
import ConverterV2 from '../../converterV2';
import { PrimaryButtonV2 } from '../../toolbox/buttons/button';
import { InputV2, AutoresizeTextarea } from '../../toolbox/inputsV2';
import Bookmark from '../../bookmarkV2';
import regex from '../../../utils/regex';
import SpinnerV2 from '../../spinnerV2/spinnerV2';
import svg from '../../../utils/svgIcons';
import styles from './form.css';
import Piwik from '../../../utils/piwik';

class Form extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      fields: {
        recipient: {
          address: '',
          balance: '',
          error: false,
          feedback: '',
          name: 'recipient',
          selected: false,
          title: '',
          value: '',
          showSuggestions: false,
        },
        amount: {
          error: false,
          value: '',
          feedback: '',
        },
        reference: {
          error: false,
          value: '',
          feedback: '',
        },
      },
    };

    this.loaderTimeout = null;

    this.validateAmountAndReference = this.validateAmountAndReference.bind(this);
    this.onAmountOrReferenceChange = this.onAmountOrReferenceChange.bind(this);
    this.onSelectedAccount = this.onSelectedAccount.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.onBookmarkBlur = this.onBookmarkBlur.bind(this);
    this.validateBookmark = this.validateBookmark.bind(this);
    this.onGoNext = this.onGoNext.bind(this);
  }

  onInputChange({ target }) {
    this.setState({
      fields: {
        ...this.state.fields,
        [target.name]: {
          ...this.state.fields[target.name],
          value: target.value,
        },
      },
    });
  }

  // eslint-disable-next-line max-statements
  validateBookmark() {
    const { followedAccounts } = this.props;
    let recipient = this.state.fields.recipient;
    let isAccountValid = '';
    let isAddressValid = '';

    if (followedAccounts.length && recipient.value !== '') {
      isAccountValid = followedAccounts
        .find(account => account.title.toLowerCase() === recipient.value.toLowerCase()) || false;
      isAddressValid = regex.address.test(recipient.value);
    } else {
      isAddressValid = recipient.value.match(regex.address);
    }

    if (isAddressValid) {
      recipient = {
        ...this.state.recipient,
        address: recipient.value,
        selected: false,
        error: false,
        feedback: '',
        showSuggestions: false,
      };
    }

    if (isAccountValid) {
      recipient = {
        ...this.state.recipient,
        address: isAccountValid.address,
        title: isAccountValid.title,
        balance: isAccountValid.balance,
        selected: true,
        error: false,
        feedback: '',
        showSuggestions: false,
      };
    }

    if (!isAccountValid && !isAddressValid && recipient.value) {
      recipient = {
        ...this.state.recipient,
        address: '',
        balance: '',
        error: true,
        feedback: 'Provide a correct wallet address or a name of a followed account',
        selected: false,
        title: '',
        showSuggestions: true,
      };
    }

    if (recipient.value === '') {
      recipient = {
        ...this.state.recipient,
        address: '',
        balance: '',
        error: false,
        feedback: '',
        selected: false,
        title: '',
        showSuggestions: false,
      };
    }

    this.setState({
      fields: {
        ...this.state.fields,
        recipient: {
          ...this.state.fields.recipient,
          ...recipient,
        },
      },
    });
  }

  onSelectedAccount(account) {
    this.setState({
      fields: {
        ...this.state.fields,
        recipient: {
          ...this.state.fields.recipient,
          ...account,
          value: account.address,
          selected: true,
          error: '',
          feedback: '',
          showSuggestions: false,
        },
      },
    });
  }

  onBookmarkBlur() {
    this.setState({
      fields: {
        ...this.state.fields,
        recipient: {
          ...this.state.fields.recipient,
          showSuggestions: false,
        },
      },
    });
  }

  validateAmountField(value) {
    if (/([^\d.])/g.test(value)) return this.props.t('Please use only digits and dots');
    if (/(\.)(.*\1){1}/g.test(value) || /\.$/.test(value)) return this.props.t('Invalid amount');
    return false;
  }

  // eslint-disable-next-line max-statements
  validateAmountAndReference(name, value) {
    const { t } = this.props;
    const messageMaxLength = 64;
    let feedback = '';
    let error = '';

    if (name === 'amount') {
      value = /^\./.test(value) ? `0${value}` : value;
      error = this.validateAmountField(value);
      feedback = error || feedback;
    }

    if (name === 'reference' && value.length > 0) {
      const byteCount = encodeURI(value).split(/%..|./).length - 1;
      error = byteCount > messageMaxLength;
      feedback = error
        ? t('{{length}} extra characters', { length: byteCount - messageMaxLength })
        : t('{{length}} out of {{total}} characters left', {
          length: messageMaxLength - value.length,
          total: messageMaxLength,
        });
    }

    this.setState(prevState => ({
      fields: {
        ...prevState.fields,
        [name]: {
          error: !!error,
          value,
          feedback,
        },
      },
    }));
  }

  onAmountOrReferenceChange({ target }) {
    clearTimeout(this.loaderTimeout);

    this.setState({ isLoading: true });

    this.loaderTimeout = setTimeout(() => {
      this.setState({ isLoading: false });
      this.validateAmountAndReference(target.name, target.value);
    }, 300);

    this.onInputChange({ target });
  }

  // eslint-disable-next-line class-methods-use-this
  onGoNext() {
    Piwik.trackingEvent('Send_Form', 'button', 'Next step');
  }

  // eslint-disable-next-line complexity
  render() {
    const { t, followedAccounts } = this.props;
    const { fields } = this.state;
    const messageMaxLength = 64;
    const byteCount = encodeURI(fields.reference.value).split(/%..|./).length - 1;
    const isBtnDisabled =
      fields.recipient.error || fields.amount.error || fields.reference.error ||
      fields.recipient.value === '' || fields.amount.value === '';

    return (
      <div className={`${styles.wrapper}`}>
        <header className={styles.header}>
          <h1>{this.props.t('Send LSK')}</h1>
        </header>

        <div className={styles.formSection}>
          <label className={`${styles.fieldGroup} recipient`}>
            <span className={`${styles.fieldLabel}`}>{t('Recipient')}</span>
            <Bookmark
              validateBookmark={this.validateBookmark}
              followedAccounts={followedAccounts}
              onChange={this.onInputChange}
              placeholder={t('e.g. 1234523423L or John Doe')}
              recipient={fields.recipient}
              showSuggestions={fields.recipient.showSuggestions}
              onSelectedAccount={this.onSelectedAccount}
            />
          </label>

          <label className={`${styles.fieldGroup}`}>
            <span className={`${styles.fieldLabel}`}>{t('Amount of trasaction')}</span>
            <span className={`${styles.amountField} amount`}>
              <InputV2
                autoComplete={'off'}
                onChange={this.onAmountOrReferenceChange}
                name='amount'
                value={fields.amount.value}
                placeholder={t('e.g. 12345.6')}
                className={`${styles.input} ${fields.amount.error ? 'error' : ''}`} />
              <ConverterV2
                className={styles.converter}
                value={fields.amount.value}
                error={fields.amount.error} />
              <SpinnerV2 className={`${styles.spinner} ${this.state.isLoading && fields.amount.value ? styles.show : styles.hide}`}/>
              <img
                className={`${styles.status} ${!this.state.isLoading && fields.amount.value ? styles.show : styles.hide}`}
                src={ fields.amount.error ? svg.alert_icon : svg.ok_icon}
              />
            </span>
            <span className={`${styles.feedback} ${fields.amount.error ? 'error' : ''} ${fields.amount.feedback ? styles.show : ''}`}>
              {fields.amount.feedback}
            </span>
            <span className={styles.amountHint}>
              {t('+0.1 LSK transaction fee')}
              <img src={svg.question_icon} />
            </span>
          </label>

          <label className={`${styles.fieldGroup} reference`}>
            <span className={`${styles.fieldLabel}`}>{t('Message (optional)')}</span>
            <span className={styles.referenceField}>
              <AutoresizeTextarea
                maxLength={100}
                spellCheck={false}
                onChange={this.onAmountOrReferenceChange}
                name='reference'
                value={fields.reference.value}
                placeholder={t('Write message')}
                className={`${styles.textarea} ${fields.reference.error ? 'error' : ''}`} />
              <SpinnerV2 className={`${styles.spinner} ${this.state.isLoading && fields.reference.value ? styles.show : styles.hide}`}/>
              <img
                className={`${styles.status} ${!this.state.isLoading && fields.reference.value ? styles.show : styles.hide}`}
                src={ fields.reference.error ? svg.alert_icon : svg.ok_icon} />
            </span>
            <span className={`${styles.feedback} ${fields.reference.error || messageMaxLength - byteCount < 10 ? 'error' : ''} ${fields.reference.feedback ? styles.show : ''}`}>
              {fields.reference.feedback}
            </span>
          </label>
        </div>

        <footer>
          <PrimaryButtonV2
            className={`${styles.confirmButton} btn-submit`}
            disabled={isBtnDisabled}
            onClick={this.onGoNext}
          >
            {t('Go to Confirmation')}
          </PrimaryButtonV2>
        </footer>
      </div>
    );
  }
}

export default Form;
