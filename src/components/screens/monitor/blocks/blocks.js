import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import BlockFilterDropdown from './blockFilterDropdown';
import Box from '../../../toolbox/box';
import BoxHeader from '../../../toolbox/box/header';
import BoxContent from '../../../toolbox/box/content';
import FilterBar from '../../../shared/filterBar';
import LoadLatestButton from '../../../shared/loadLatestButton';
import MonitorHeader from '../header';
import Table from '../../../toolbox/table';
import styles from './blocks.css';
import withFilters from '../../../../utils/withFilters';
import BlocksOverview from './blocksOverview';
import BlockRow from './blockRow';
import header from './tableHeader';

const Blocks = ({
  t,
  blocks,
  filters,
  applyFilters,
  clearFilter,
  clearAllFilters,
  sort,
  changeSort,
}) => {
  const formatters = {
    height: value => `${t('Height')}: ${value}`,
    /* istanbul ignore next */
    address: value => `${t('Generated by')}: ${value}`,
  };

  const handleLoadMore = () => {
    blocks.loadData(Object.keys(filters).reduce((acc, key) => ({
      ...acc,
      ...(filters[key] && { [key]: filters[key] }),
    }), {
      offset: blocks.data.length,
      sort,
    }));
  };

  /* istanbul ignore next */
  const loadLastBlocks = () => applyFilters(filters);

  const canLoadMore = blocks.meta ? blocks.meta.count === 30 : false;

  return (
    <div>
      <MonitorHeader />
      <BlocksOverview t={t} />
      <Box isLoading={blocks.isLoading} width="full" main>
        <BoxHeader>
          <h2 className="blocks-header-title">{t('All blocks')}</h2>
          <BlockFilterDropdown filters={filters} applyFilters={applyFilters} />
        </BoxHeader>
        <LoadLatestButton
          event="update.block"
          onClick={loadLastBlocks}
        >
          {t('New blocks')}
        </LoadLatestButton>
        <FilterBar {...{
          clearFilter, clearAllFilters, filters, formatters, t,
        }}
        />
        <BoxContent className={styles.content}>
          <Table
            data={blocks.data}
            isLoading={blocks.isLoading}
            row={BlockRow}
            loadData={handleLoadMore}
            header={header(changeSort, t)}
            currentSort={sort}
            canLoadMore={canLoadMore}
            error={blocks.error}
          />
        </BoxContent>
      </Box>
    </div>
  );
};

Blocks.propTypes = {
  t: PropTypes.func.isRequired,
  blocks: PropTypes.shape({
    data: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
  }).isRequired,
};

const defaultFilters = {
  dateFrom: '',
  dateTo: '',
  height: '',
  address: '',
};
const defaultSort = 'height:desc';

export default withTranslation()(withFilters('blocks', defaultFilters, defaultSort)(Blocks));
