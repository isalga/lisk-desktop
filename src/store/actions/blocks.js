import { actionTypes, ROUND_LENGTH } from '@constants';
import { convertUnixSecondsToLiskEpochSeconds } from '@utils/datetime';
import { getBlocks } from '@api/block';
import { getForgers } from '@api/delegate';

/**
 * Retrieves latest blocks from Lisk Service.
 * The iteration of time conversion can be merged
 * into reducer to reduce the big-O factor
 *
 * @param {Object} params - API query parameters
 * @param {Object} network - Network configuration for mainnet/testnet/devnet
 * @returns {Array} - the list of blocks
 */
const loadLastBlocks = async (params, network) => {
  const blocks = await getBlocks({ network, params });
  const total = blocks.meta.total;
  return {
    total,
    list: blocks.data.map(block => ({
      ...block,
      timestamp: convertUnixSecondsToLiskEpochSeconds(block.timestamp),
    })),
  };
};

export const olderBlocksRetrieved = () => async (dispatch, getState) => {
  const blocksFetchLimit = 100;
  const { network } = getState();

  const batch1 = await loadLastBlocks({ limit: blocksFetchLimit }, network);
  const batch2 = await loadLastBlocks({
    offset: blocksFetchLimit, limit: blocksFetchLimit,
  }, network);

  return dispatch({
    type: actionTypes.olderBlocksRetrieved,
    data: {
      list: [
        ...batch1.list,
        ...batch2.list,
      ],
      total: batch1.total,
    },
  });
};

/**
 * Fire this action after network is set.
 * It retrieves the list of forgers in the current
 * round and determines their status as forging, missedBlock
 * and awaitingSlot.
 */
export const forgersRetrieved = () => async (dispatch, getState) => {
  const { network, blocks: { latestBlocks } } = getState();
  const forgedBlocksInRound = latestBlocks[0].height % ROUND_LENGTH;
  const remainingBlocksInRound = ROUND_LENGTH - forgedBlocksInRound;
  const { data } = await getForgers({
    network,
    params: { limit: ROUND_LENGTH },
  });
  let forgers = [];

  // Get the list of usernames that already forged in this round
  const haveForgedInRound = latestBlocks
    .filter((b, i) => forgedBlocksInRound >= i)
    .map(b => b.generatorUsername);

  // check previous blocks and define missed blocks
  if (data) {
    forgers = data.map((forger, index) => {
      if (haveForgedInRound.indexOf(forger.username) > -1) {
        return { ...forger, status: 'forging' };
      }
      if (index < remainingBlocksInRound) {
        return { ...forger, status: 'awaitingSlot' };
      }
      return { ...forger, status: 'missedBlock' };
    });
  }

  dispatch({
    type: actionTypes.forgersRetrieved,
    data: forgers,
  });
};
