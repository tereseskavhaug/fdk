import {
  CATALOGS_REQUEST,
  CATALOGS_SUCCESS,
  CATALOGS_FAILURE
} from '../../constants/ActionTypes';

export default function catalogs(
  state = { isFetchingCatalogs: false, catalogItems: null },
  action
) {
  switch (action.type) {
    case CATALOGS_REQUEST:
      return {
        ...state,
        isFetchingCatalogs: true
      };
    case CATALOGS_SUCCESS:
      return {
        ...state,
        isFetchingCatalogs: false,
        catalogItems: action.payload
      };
    case CATALOGS_FAILURE:
      return {
        ...state,
        isFetchingCatalogs: false,
        catalogItems: null
      };
    default:
      return state;
  }
}

export const getCatalogItemByCatalogId = (catalogItems, catalogId) => {
  if (Array.isArray(_.get(catalogItems, ['_embedded', 'catalogs']))) {
    return _.get(catalogItems, ['_embedded', 'catalogs']).filter(
      item => item.id === catalogId
    )[0];
  }
  return null;
};
