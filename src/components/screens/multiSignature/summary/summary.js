import React from 'react';
import { MODULE_ASSETS_NAME_ID_MAP } from '@constants';
import TransactionInfo from '@shared/transactionInfo';
import Box from '@toolbox/box';
import BoxContent from '@toolbox/box/content';
import BoxFooter from '@toolbox/box/footer';
import { PrimaryButton, SecondaryButton } from '@toolbox/buttons';
import ProgressBar from '../progressBar';
import styles from './styles.css';

const moduleAssetId = MODULE_ASSETS_NAME_ID_MAP.registerMultisignatureGroup;

const Summary = ({
  t,
  members,
  fee,
  account,
  mandatoryKeys,
  optionalKeys,
  numberOfSignatures,
  prevStep,
  nextStep,
  multisigGroupRegistered,
}) => {
  // eslint-disable-next-line max-statements
  const onConfirm = () => {
    nextStep({
      rawTransaction: {
        fee: String(fee),
        mandatoryKeys,
        optionalKeys,
        numberOfSignatures,
      },
      actionFunction: multisigGroupRegistered,
      statusInfo: {
        mandatoryKeys,
        optionalKeys,
        numberOfSignatures,
      },
    });
  };

  const goBack = () => {
    prevStep({ mandatoryKeys, optionalKeys, numberOfSignatures });
  };

  return (
    <section className={styles.wrapper}>
      <Box className={styles.container}>
        <div className={styles.header}>
          <h1>{t('Register multisignature account')}</h1>
        </div>
        <BoxContent className={styles.content}>
          <ProgressBar current={2} />
          <TransactionInfo
            t={t}
            fee={fee}
            account={account}
            members={members}
            moduleAssetId={moduleAssetId}
            numberOfSignatures={numberOfSignatures}
          />
        </BoxContent>
        <BoxFooter className={styles.footer} direction="horizontal">
          <SecondaryButton className="go-back" onClick={goBack}>{t('Edit')}</SecondaryButton>
          <PrimaryButton className="confirm" size="l" onClick={onConfirm}>
            {t('Sign')}
          </PrimaryButton>
        </BoxFooter>
      </Box>
    </section>
  );
};

export default Summary;
