import React from 'react';

import AccountVisual from '@toolbox/accountVisual';
import { truncateAddress } from '@utils/account';

import styles from './styles.css';

const Member = ({ member, i, t }) => (
  <div className={`${styles.memberInfo} member-info`}>
    {i !== undefined && <p className={styles.memberInfoIndex}>{`${i + 1}.`}</p>}
    <AccountVisual address={member.address} />
    <div className={styles.memberDetails}>
      <p className={styles.memberTitle}>
        {member.name || truncateAddress(member.address)}
        <span>{`(${member.mandatory ? t('Mandatory') : t('Optional')})`}</span>
      </p>
      <p className={styles.memberKey}>{truncateAddress(member.publicKey)}</p>
    </div>
  </div>
);

const Members = ({ members, t, className }) => {
  const sliceIndex = Math.round(members.length / 2);
  const leftColumn = members.slice(0, sliceIndex);
  const rightColumn = members.slice(sliceIndex, members.length);
  return (
    <div className={`${styles.membersContainer} ${className}`}>
      <p className={styles.title}>{t('Members')}</p>
      <div>
        {leftColumn.map((member, i) =>
          <Member member={member} i={i} key={`registerMultiSignature-members-list-${i}`} t={t} />)}
      </div>
      <div>
        {rightColumn.map((member, i) =>
          <Member member={member} i={i + sliceIndex} key={`registerMultiSignature-members-list-${i + sliceIndex}`} t={t} />)}
      </div>
    </div>
  );
};

export const SignedAndRemainingMembers = ({
  signed, remaining, className, t,
}) => (
  <div className={`${styles.membersContainer} ${className}`}>
    <div>
      <p>{t('Signed')}</p>
      {signed.map((member, i) =>
        <Member member={member} key={`registerMultiSignature-members-list-${i}`} t={t} />)}
    </div>
    <div>
      <p>{t('Remaining')}</p>
      {remaining.map((member, i) =>
        <Member member={member} key={`registerMultiSignature-members-list-${i}-remaining`} t={t} />)}
    </div>
  </div>
);

export default Members;
