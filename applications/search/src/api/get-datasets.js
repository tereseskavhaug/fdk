import _ from 'lodash';
import axios from 'axios';

import { addOrReplaceParam } from '../lib/addOrReplaceUrlParam';
import { normalizeAggregations } from './../lib/normalizeAggregations';

export const getDatasets = async search => {
  const datasetsUrl = `/datasets${search}`;
  const url = addOrReplaceParam(datasetsUrl, 'size', '10');

  const response = await axios
    .get(url)
    .catch(e => console.log(JSON.stringify(e))); // eslint-disable-line no-console

  return response && normalizeAggregations(response.data);
};

export const createNestedListOfPublishers = listOfPublishers => {
  const nestedListOfPublishers = _(listOfPublishers).forEach(publisherItem => {
    const filteredChildrenOfParentPublishers = _(listOfPublishers)
      .filter(
        g => g.key.substring(0, g.key.lastIndexOf('/')) === publisherItem.key
      )
      .value();

    filteredChildrenOfParentPublishers.forEach(item => {
      const retVal = item;
      retVal.hasParent = true;
      return retVal;
    });

    const retVal = publisherItem;
    retVal.children = filteredChildrenOfParentPublishers;
    return retVal;
  });

  return _(nestedListOfPublishers)
    .filter(f => !f.hasParent)
    .value();
};

export const extractPublisherCounts = datasetsSearchResponse => {
  const publisherBuckets = _.get(
    datasetsSearchResponse,
    'aggregations.orgPath.buckets',
    []
  );
  return createNestedListOfPublishers(publisherBuckets);
};
