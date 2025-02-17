import React, { useState, useEffect } from 'react';
import {
  PrimaryButton,
  SecondaryButton,
} from '@toolbox/buttons';
import Illustration from '@toolbox/illustration';
import { transactionToJSON, downloadJSON } from '@utils/transaction';
import { routes, txStatusTypes } from '@constants';

import copyToClipboard from 'copy-to-clipboard';
import Icon from '@toolbox/icon';
import getIllustration from './illustrations';
import styles from './transactionResult.css';

export const PartiallySignedActions = ({ onDownload, t }) => (
  <PrimaryButton
    className={`${styles.download} download-button`}
    onClick={onDownload}
  >
    <span className={styles.buttonContent}>
      <Icon name="download" />
      {t('Download')}
    </span>
  </PrimaryButton>
);

export const FullySignedActions = ({ t, onDownload, onSend }) => (
  <>
    <SecondaryButton
      className={`${styles.download} ${styles.secondary} download-button`}
      onClick={onDownload}
    >
      <span className={styles.buttonContent}>
        <Icon name="download" />
        {t('Download')}
      </span>
    </SecondaryButton>
    <PrimaryButton
      className={`${styles.download} send-button`}
      onClick={onSend}
    >
      <span className={styles.buttonContent}>
        {t('Send')}
      </span>
    </PrimaryButton>
  </>
);

const Multisignature = ({
  transactions, title, message, t, status, className, history,
  resetTransactionResult, transactionBroadcasted, account,
}) => {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    copyToClipboard(transactionToJSON(transactions.signedTransaction));
    setCopied(true);
  };

  const onDownload = () => {
    const transaction = JSON.parse(transactionToJSON(transactions.signedTransaction));
    downloadJSON(transaction, `tx-${transaction.id}`);
  };

  const onSend = () => {
    transactionBroadcasted(transactions.signedTransaction);
  };

  const goToWallet = () => {
    history.push(routes.wallet.path);
  };

  useEffect(() => resetTransactionResult, []);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Illustration name={getIllustration(status.code, 'signMultisignature', account.hwInfo)} />
      <h6 className="result-box-header">{title}</h6>
      <p className="transaction-status body-message">{message}</p>

      <div className={styles.primaryActions}>
        {
          status.code === txStatusTypes.broadcastSuccess
            ? (
              <PrimaryButton
                className={`${styles.backToWallet} back-to-wallet-button`}
                onClick={goToWallet}
              >
                {t('Back to wallet')}
              </PrimaryButton>
            ) : (
              <SecondaryButton
                className={`${styles.copy} copy-button`}
                onClick={onCopy}
              >
                <span className={styles.buttonContent}>
                  <Icon name={copied ? 'checkmark' : 'copy'} />
                  {t(copied ? 'Copied' : 'Copy')}
                </span>
              </SecondaryButton>
            )
        }
        {
          status.code === txStatusTypes.multisigSignatureSuccess
            ? <FullySignedActions onDownload={onDownload} t={t} onSend={onSend} /> : null
        }
        {
          status.code === txStatusTypes.multisigSignaturePartialSuccess
            ? <PartiallySignedActions onDownload={onDownload} t={t} /> : null
        }
      </div>
    </div>
  );
};

export default Multisignature;
