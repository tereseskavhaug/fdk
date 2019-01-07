import _ from 'lodash';
import { fetchActions } from '../fetchActions';

export const INFORMATIONMODELS_REQUEST = 'INFORMATIONMODELS_REQUEST';
export const INFORMATIONMODELS_SUCCESS = 'INFORMATIONMODELS_SUCCESS';
export const INFORMATIONMODELS_FAILURE = 'INFORMATIONMODELS_FAILURE';

function shouldFetch(metaState, query) {
  const threshold = 60 * 1000; // seconds
  return (
    !metaState ||
    (!metaState.isFetching &&
      ((metaState.lastFetch || 0) < Date.now() - threshold ||
        metaState.cachedQuery !== query))
  );
}

export function fetchInformationModelsIfNeededAction(query) {
  return (dispatch, getState) =>
    shouldFetch(_.get(getState(), ['informationModels', 'meta']), query) &&
    dispatch(
      fetchActions(`/api/apis/search?${query}`, [
        { type: INFORMATIONMODELS_REQUEST, meta: { query } },
        { type: INFORMATIONMODELS_SUCCESS, meta: { query } },
        INFORMATIONMODELS_FAILURE
      ])
    );
}

export function setMockInformationModel(payload) {
  return dispatch => {
    dispatch({
      type: INFORMATIONMODELS_SUCCESS,
      meta: { query: { q: 'mock' } },
      payload
    });
  };
}

const initialState = {};

export function informationModelsReducer(state = initialState, action) {
  switch (action.type) {
    case INFORMATIONMODELS_REQUEST:
      return {
        ...state,
        meta: {
          isFetching: true,
          lastFetch: null,
          cachedQuery: action.meta.query
        }
      };
    case INFORMATIONMODELS_SUCCESS:
      return {
        ...state,
        informationModelItems: _.get(action.payload, 'hits'),
        informationModelAggregations: _.get(action.payload, 'aggregations'),
        informationModelTotal: _.get(action.payload, 'total'),
        meta: {
          isFetching: false,
          lastFetch: Date.now(),
          cachedQuery: action.meta.query
        }
      };
    case INFORMATIONMODELS_FAILURE:
      return {
        ...state,
        informationModelItems: null,
        informationModelAggregations: null,
        informationModelTotal: null,
        meta: {
          isFetching: false,
          lastFetch: null,
          cachedQuery: null
        }
      };
    default:
      return state;
  }
}
