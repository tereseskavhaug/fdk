import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { parse } from 'qs';
import axios from 'axios';

import getTranslateText from '../../utils/translateText';
import localization from '../../utils/localization';
import { ListRegular } from '../../components/list-regular/list-regular.component';
import { ListRegularItem } from '../../components/list-regular/list-regular-item/list-regular-item.component';
import { AlertMessage } from '../../components/alert-message/alert-message.component';
import { FormTemplateWithState } from '../../components/form-template/form-template-with-state.component';
import { ConnectedFormMeta } from './form-meta/connected-form-meta';
import { ConnectedFormRelatedDatasets } from './form-relatedDatasets/connected-form-related-datasets';
import { StatusBarWithState } from '../../components/status-bar/status-bar.component';
import { ConnectedFormPublish } from './connected-form-publish/connected-form-publish';

const renderOpenApiInfo = (info, paths) => {
  if (!info) {
    return null;
  }

  return (
    <ListRegular title={localization.api.register.importFromSpec}>
      {_.get(info, 'title') && (
        <ListRegularItem
          asideContent={localization.title}
          mainContent={_.get(info, 'title')}
        />
      )}
      {_.get(info, 'description') && (
        <ListRegularItem
          asideContent={localization.description}
          mainContent={_.get(info, 'description')}
        />
      )}
      {_.get(info, 'version') && (
        <ListRegularItem
          asideContent={localization.version}
          mainContent={_.get(info, 'version')}
        />
      )}
      {paths && (
        <ListRegularItem
          asideContent={localization.operations}
          mainContent={`${Object.keys(paths).length} ${
            Object.keys(paths).length > 0
              ? localization.operations.toLowerCase()
              : localization.operation.toLowerCase()
          }`}
        />
      )}
      {_.get(info, ['license', 'url']) && (
        <div className="d-flex list-regular--item">
          <div className="col-4 pl-0 fdk-text-strong">
            {localization.license}
          </div>
          <div className="col-8">
            <a href={_.get(info, ['license', 'url'])}>
              {_.get(info, ['license', 'name'])}
              <i className="fa fa-external-link fdk-fa-right" />
            </a>
          </div>
        </div>
      )}
      {_.get(info, 'termsOfService') && (
        <div className="d-flex list-regular--item">
          <div className="col-4 pl-0 fdk-text-strong">
            {localization.termsOfService}
          </div>
          <div className="col-8">
            <a href={_.get(info, 'termsOfService')}>
              {_.get(info, 'termsOfService')}
              <i className="fa fa-external-link fdk-fa-right" />
            </a>
          </div>
        </div>
      )}
      {_.get(info, 'contact') && (
        <div className="d-flex list-regular--item">
          <div className="col-4 pl-0 fdk-text-strong">
            {localization.contactInformation}
          </div>
          <div className="col-8">
            <span>{_.get(info, ['contact', 'name'])}, </span>
            <span>{_.get(info, ['contact', 'url'])}, </span>
            <span>{_.get(info, ['contact', 'email'])}, </span>
          </div>
        </div>
      )}
    </ListRegular>
  );
};

export const APIRegistrationPage = props => {
  const {
    fetchCatalogIfNeeded,
    fetchApisIfNeeded,
    fetchHelptextsIfNeeded,
    deleteApiItem,
    catalogItem,
    lastSaved,
    isSaving,
    error,
    justPublishedOrUnPublished,
    registrationStatus,
    helptextItems,
    item,
    location,
    match,
    publisher,
    referencedDatasets
  } = props;
  const catalogId = _.get(match, ['params', 'catalogId']);
  const searchQuery =
    parse(_.get(location, 'search'), { ignoreQueryPrefix: true }) || {};
  const info = _.get(item, ['openApi', 'info']);

  fetchCatalogIfNeeded(catalogId);
  fetchApisIfNeeded(catalogId);
  fetchHelptextsIfNeeded();

  const deleteApi = () => {
    const { history, match } = props;
    const api = {
      Authorization: `Basic user:password`
    };

    return axios
      .delete(match.url, { headers: api })
      .then(() => {
        deleteApiItem(catalogId, _.get(item, 'id'));
        if (history) {
          history.push({
            pathname: `/catalogs/${catalogId}/apis`,
            state: { confirmDelete: true }
          });
        }
      })
      .catch(response => {
        const { error } = response;
        return Promise.reject(error);
      });
  };

  return (
    <div className="container">
      <div className="row mb-5">
        <div className="col-12">
          <h1>{_.get(info, 'title')}</h1>
          <div className="fdk-reg-datasets-publisher mt-2 mb-4">
            {getTranslateText(_.get(catalogItem, ['publisher', 'prefLabel'])) ||
              _.get(catalogItem, ['publisher', 'name'])}
          </div>
        </div>
      </div>

      {_.get(searchQuery, 'importSuccess') && (
        <div className="row mb-5">
          <div className="col-12">
            <AlertMessage type="success">
              {localization.api.register.importFromSpecPart1}{' '}
              {_.get(searchQuery, 'importSuccess')}{' '}
              {localization.api.register.importFromSpecPart2}
            </AlertMessage>
          </div>
        </div>
      )}

      <div className="row mb-5">
        <div className="col-12">
          {renderOpenApiInfo(info, _.get(item, ['openApi', 'paths']))}
        </div>
      </div>

      <div className="row mb-5">
        <div className="col-12">
          <h3>Tilleggsinformasjon</h3>
          <span>{localization.api.register.addInfo}</span>
        </div>
      </div>

      {item && (
        <React.Fragment>
          <div className="row mb-5">
            <div className="col-12">
              <FormTemplateWithState
                showInitially
                title={localization.schema.apiMeta.title}
              >
                <ConnectedFormMeta
                  apiItem={item}
                  match={match}
                  helptextItems={helptextItems}
                />
              </FormTemplateWithState>
            </div>
          </div>

          <div className="row mb-5">
            <div className="col-12">
              <FormTemplateWithState
                showInitially
                title={localization.schema.apiDatasetReferences.title}
              >
                <ConnectedFormRelatedDatasets
                  apiItem={item}
                  match={match}
                  orgPath={_.get(publisher, 'orgPath')}
                  helptextItems={helptextItems}
                  referencedDatasets={referencedDatasets}
                />
              </FormTemplateWithState>
            </div>
          </div>

          <StatusBarWithState
            type="api"
            isSaving={isSaving}
            lastSaved={lastSaved}
            published={
              registrationStatus
                ? !!(registrationStatus === 'PUBLISH')
                : !!(_.get(item, 'registrationStatus', 'DRAFT') === 'PUBLISH')
            }
            error={error}
            justPublishedOrUnPublished={justPublishedOrUnPublished}
            onDelete={deleteApi}
            formComponent={
              <ConnectedFormPublish
                initialItemStatus={_.get(item, 'registrationStatus', '')}
                match={match}
              />
            }
          />
        </React.Fragment>
      )}
    </div>
  );
};

APIRegistrationPage.defaultProps = {
  fetchCatalogIfNeeded: _.noop(),
  fetchApisIfNeeded: _.noop,
  fetchHelptextsIfNeeded: _.noop(),
  deleteApiItem: _.noop(),
  catalogItem: null,
  lastSaved: null,
  isSaving: false,
  error: null,
  justPublishedOrUnPublished: false,
  registrationStatus: null,
  helptextItems: null,
  item: null,
  location: null,
  match: null,
  publisher: null,
  referencedDatasets: null
};

APIRegistrationPage.propTypes = {
  fetchCatalogIfNeeded: PropTypes.func,
  fetchApisIfNeeded: PropTypes.func,
  fetchHelptextsIfNeeded: PropTypes.func,
  deleteApiItem: PropTypes.func,
  catalogItem: PropTypes.object,
  lastSaved: PropTypes.string,
  isSaving: PropTypes.bool,
  error: PropTypes.number,
  justPublishedOrUnPublished: PropTypes.bool,
  registrationStatus: PropTypes.string,
  helptextItems: PropTypes.object,
  item: PropTypes.object,
  location: PropTypes.object,
  match: PropTypes.object,
  publisher: PropTypes.object,
  referencedDatasets: PropTypes.array
};
