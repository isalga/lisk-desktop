import PropTypes from 'prop-types';
import React from 'react';
import withFilters from '@utils/withFilters';
import Box from '@toolbox/box';
import BoxContent from '@toolbox/box/content';
import FilterBar from '@shared/filterBar';
import StickyHeader from '@shared/stickyHeader';
import Table from '@toolbox/table';
import BlockFilterDropdown from './blockFilterDropdown';
import styles from './blocks.css';
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
    generator: value => `${t('Generated by')}: ${value}`,
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
  const loadLastBlocks = () => { applyFilters(filters); };

  const canLoadMore = blocks.meta && blocks.meta.total > blocks.data.length;

  return (
    <div>
      <BlocksOverview t={t} />
      <Box isLoading={blocks.isLoading} className="blocks-container" width="full" main>
        <StickyHeader
          title={t('All blocks')}
          button={{
            entity: 'block',
            onClick: loadLastBlocks,
            label: t('New blocks'),
          }}
          scrollToSelector=".blocks-container"
          filters={
            <BlockFilterDropdown filters={filters} applyFilters={applyFilters} />
          }
        />
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
            headerClassName={styles.tableHeader}
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
  generator: '',
};
const defaultSort = 'height:desc';

export default withFilters('blocks', defaultFilters, defaultSort)(Blocks);
