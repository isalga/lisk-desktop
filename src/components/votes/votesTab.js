import React from 'react';
import PropTypes from 'prop-types';
import grid from 'flexboxgrid/dist/flexboxgrid.css';
import { translate } from 'react-i18next';
import BoxV2 from '../boxV2';
import AccountVisual from '../accountVisual';
import VotesTableHeader from './votesTableHeader';
import TableRow from '../toolbox/table/tableRow';
import SpinnerV2 from '../spinnerV2/spinnerV2';
import { InputV2 } from '../toolbox/inputsV2';
import LiskAmount from '../liskAmount';
import styles from './votesTab.css';

class VotesTab extends React.Component {
  constructor() {
    super();

    this.state = {
      showing: 30,
      filterValue: '',
    };

    this.onShowMore = this.onShowMore.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
  }

  onShowMore() {
    const max = this.props.votes.length;
    const showing = (this.state.showing + 30 > max) ? max : this.state.showing + 30;
    this.setState({ showing });
    this.props.searchVotesDelegate(this.props.votes, {
      address: this.props.address,
      showingVotes: showing,
    });
  }

  handleFilter({ target }) {
    this.setState({
      filterValue: target.value,
    });
  }

  render() {
    const { t, votes, loading } = this.props;
    const { filterValue } = this.state;
    const filteredVotes = votes ? votes.filter(vote => RegExp(filterValue, 'i').test(vote.username)) : [];
    const canLoadMore = filteredVotes.length > this.state.showing;
    const isLoading = loading.length > 0;

    return (
      <BoxV2 className={`${styles.wrapper}`}>
        <header>
          <h1>{t('Voted delegates')}</h1>
          <div className={`${styles.filterHolder}`}>
            <InputV2
              disabled={votes && votes.length === 0}
              name={'filter'}
              value={filterValue}
              placeholder={t('Filter by name')}
              onChange={this.handleFilter} />
          </div>
        </header>
        <main className={`${styles.results} ${canLoadMore ? styles.hasMore : ''} ${isLoading ? styles.isLoading : ''}`}>
          <VotesTableHeader />
          {
            isLoading ? (
              <div className={styles.loadingOverlay}>
                <SpinnerV2 className={`${styles.loadingSpinner}`} />
              </div>
            ) : null
          }
          {filteredVotes.length > 0
            ? filteredVotes.slice(0, this.state.showing).map((vote, key) => (
              <TableRow key={`row-${key}`}>
                <div className={`${grid['col-sm-1']} ${grid['col-lg-1']}`}>
                  {(vote.rank && +vote.rank < 10 ? `0${vote.rank}` : vote.rank) || '-'}
                </div>
                <div className={`${grid['col-sm-3']} ${grid['col-lg-6']}`}>
                  <div className={`${styles.info}`}>
                    <AccountVisual
                      className={`${styles.avatar}`}
                      address={vote.address}
                      size={36} />
                    <div className={styles.accountInfo}>
                      <span className={`${styles.title}`}>{vote.username}</span>
                      <span>{vote.address}</span>
                    </div>
                  </div>
                </div>
                <div className={`${grid['col-sm-3']} ${grid['col-lg-2']}`}>
                  {vote.rewards
                    ? <span><LiskAmount val={vote.rewards}/> {t('LSK')}</span>
                    : '-'}
                </div>
                <div className={`${grid['col-sm-2']} ${grid['col-lg-1']}`}>
                  {vote.productivity !== undefined ? `${vote.productivity}%` : '-'}
                </div>
                <div className={`${grid['col-sm-3']} ${grid['col-lg-2']}`}>
                  {vote.vote
                    ? <span><LiskAmount val={vote.vote}/> {t('LSK')}</span>
                    : '-'}
                </div>
              </TableRow>
            )) : (
              <p className={`${styles.empty} empty-message`}>
                { filterValue === ''
                  ? t('This wallet doesn’t have any votes')
                  : t('There are no results matching this filter')
                }
              </p>
            )}
          { canLoadMore && <span
            onClick={this.onShowMore}
            className={`${styles.showMore} show-more-button`}>{t('Show More')}</span>
          }
        </main>
      </BoxV2>
    );
  }
}

VotesTab.propTypes = {
  votes: PropTypes.arrayOf(PropTypes.shape({
    username: PropTypes.string,
    address: PropTypes.string,
  })),
  loading: PropTypes.array,
  t: PropTypes.func,
};

VotesTab.defaultProps = {
  votes: [],
  loading: [],
  t: v => v,
};

export default translate()(VotesTab);
