import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import qs from 'qs';
import queryString from 'query-string';
import { Route, Switch } from 'react-router-dom';
import cx from 'classnames';
import { detect } from 'detect-browser';

import localization from '../../components/localization';
import {
  fetchDatasetsIfNeeded,
  fetchTermsIfNeeded,
  fetchThemesIfNeeded,
  fetchPublishersIfNeeded
} from '../../actions/index';
import ResultsDataset from '../../components/search-results-dataset';
import ResultsConcepts from '../../components/search-concepts-results';
import SearchBox from '../../components/search-app-searchbox';
import ResultsTabs from '../../components/search-results-tabs';
import { removeValue, addValue } from '../../utils/stringUtils';
import {
  addOrReplaceParamWithoutURL,
  getParamFromString
} from '../../utils/addOrReplaceUrlParam';
import './index.scss';

const ReactGA = require('react-ga');

const browser = detect();

export class SearchPage extends React.Component {
  constructor(props) {
    super(props);
    const searchQuery =
      props.location && props.location.search
        ? queryString.parse(props.location.search)
        : {
            searchQuery: {}
          };

    this.state = {
      showConcepts: false,
      showFilterModal: false,
      searchQuery
    };

    this.handleClearSearch = this.handleClearSearch.bind(this);
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleDatasetFilterThemes = this.handleDatasetFilterThemes.bind(this);
    this.handleDatasetFilterAccessRights = this.handleDatasetFilterAccessRights.bind(
      this
    );
    this.handleDatasetFilterPublisher = this.handleDatasetFilterPublisher.bind(
      this
    );
    this.handleDatasetFilterPublisherHierarchy = this.handleDatasetFilterPublisherHierarchy.bind(
      this
    );
    this.handleDatasetSort = this.handleDatasetSort.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
  }

  componentDidMount() {
    const { location } = this.props;
    let hasSingleWord = false;
    const q =
      location && location.search
        ? getParamFromString(location.search, 'q')
        : null;
    if (q) {
      hasSingleWord = !q.includes(' ') && !q.includes('*'); // no spaces and no asterix search
    }
    if (hasSingleWord) {
      const modifiedQ = addOrReplaceParamWithoutURL(
        location.search,
        'q',
        `${q} ${encodeURIComponent(q)}*`
      );
      this.props.fetchDatasetsIfNeeded(`/datasets/${modifiedQ}`);
      this.props.fetchTermsIfNeeded(`/terms/${modifiedQ}`);
    } else {
      this.props.fetchDatasetsIfNeeded(`/datasets${location.search}`);
      this.props.fetchTermsIfNeeded(`/terms${location.search}`);
    }
    this.props.fetchThemesIfNeeded();
    this.props.fetchPublishersIfNeeded();
  }

  componentWillReceiveProps(nextProps) {
    const { selectedLanguageCode } = nextProps;
    if (nextProps.location.search !== this.props.location.search) {
      const q = getParamFromString(nextProps.location.search, 'q');
      let hasSingleWord = false;
      if (q) {
        hasSingleWord = !q.includes(' ') && !q.includes('*'); // no spaces and no asterix search
      }
      if (hasSingleWord) {
        const modifiedQ = addOrReplaceParamWithoutURL(
          nextProps.location.search,
          'q',
          `${q} ${encodeURIComponent(q)}*`
        );
        this.props.fetchDatasetsIfNeeded(`/datasets${modifiedQ}`);
        this.props.fetchTermsIfNeeded(`/terms${modifiedQ}`);
      } else {
        this.props.fetchDatasetsIfNeeded(
          `/datasets${nextProps.location.search}`
        );
        this.props.fetchTermsIfNeeded(`/terms${nextProps.location.search}`);
      }
    }
    if (selectedLanguageCode !== this.props.selectedLanguageCode) {
      if (selectedLanguageCode === 'nb') {
        this.setState({
          searchQuery: {
            ...this.state.searchQuery,
            lang: undefined
          }
        });
      } else {
        this.setState({
          searchQuery: {
            ...this.state.searchQuery,
            lang: selectedLanguageCode
          }
        });
      }
    }
  }

  handleClearSearch() {
    this.setState(
      {
        searchQuery: {
          lang: this.state.searchQuery.lang
        }
      },
      () => this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
    );
  }

  handleSearchSubmit() {
    this.props.history.push(
      `?${qs.stringify(this.state.searchQuery, { skipNulls: true })}`
    );
  }

  handleSearchChange(event) {
    this.setState({
      searchQuery: {
        ...this.state.searchQuery,
        q: event.target.value !== '' ? event.target.value : null,
        from: undefined
      }
    });
  }

  handleDatasetFilterThemes(event) {
    const { theme } = this.state.searchQuery;
    if (event.target.checked) {
      ReactGA.event({
        category: 'Fasett',
        action: 'Legge til tema',
        label: event.target.value
      });
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            theme: addValue(theme, event.target.value),
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    } else {
      ReactGA.event({
        category: 'Fasett',
        action: 'Fjerne tema',
        label: event.target.value
      });
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            theme: removeValue(theme, event.target.value),
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    }
  }

  handleDatasetFilterAccessRights(event) {
    const { accessrights } = this.state.searchQuery;
    if (event.target.checked) {
      ReactGA.event({
        category: 'Fasett',
        action: 'Legge til tilgang',
        label: event.target.value
      });
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            accessrights: addValue(accessrights, event.target.value),
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    } else {
      ReactGA.event({
        category: 'Fasett',
        action: 'Fjerne tilgang',
        label: event.target.value
      });
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            accessrights: removeValue(accessrights, event.target.value),
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    }
  }

  handleDatasetFilterPublisher(event) {
    const { publisher } = this.state.searchQuery;
    if (event.target.checked) {
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            publisher: addValue(publisher, event.target.value),
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    } else {
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            publisher: removeValue(publisher, event.target.value),
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    }
  }

  handleDatasetFilterPublisherHierarchy(event) {
    if (event.target.checked) {
      ReactGA.event({
        category: 'Fasett',
        action: 'Legge til virksomhet',
        label: event.target.value
      });
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            orgPath: event.target.value,
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    } else {
      ReactGA.event({
        category: 'Fasett',
        action: 'Fjerne virksomhet',
        label: event.target.value
      });
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            orgPath: undefined,
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    }
  }

  handleDatasetSort(event) {
    let sortField = event.field;

    ReactGA.event({
      category: 'Sortere',
      action: 'Sortere',
      label: sortField
    });

    if (sortField === '_score') {
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            sortfield: undefined,
            sortdirection: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    } else {
      if (sortField === 'title') {
        sortField = sortField.concat('.').concat(localization.getLanguage());
      }
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            sortfield: sortField,
            sortdirection: event.order
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    }
  }

  handlePageChange(data) {
    const selected = data.selected;
    const offset = Math.ceil(selected * 50);

    ReactGA.event({
      category: 'Paginering',
      action: 'Ny side',
      label: offset
    });

    if (offset === 0) {
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            from: undefined
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    } else {
      this.setState(
        {
          searchQuery: {
            ...this.state.searchQuery,
            from: offset
          }
        },
        () =>
          this.props.history.push(`?${qs.stringify(this.state.searchQuery)}`)
      );
    }
  }

  close() {
    this.setState({ showFilterModal: false });
  }

  open() {
    this.setState({ showFilterModal: true });
  }

  render() {
    const {
      selectedLanguageCode,
      datasetItems,
      publisherCountItems,
      isFetchingDatasets,
      termItems,
      publisherCountTermItems,
      isFetchingTerms,
      themesItems,
      publisherItems
    } = this.props;
    const topSectionClass = cx('top-section-search', 'mb-1-em', {
      'top-section-search--image': !!(browser && browser.name !== 'ie')
    });
    return (
      <div>
        <section className={topSectionClass}>
          <div className="container">
            <SearchBox
              onSearchSubmit={this.handleSearchSubmit}
              onSearchChange={this.handleSearchChange}
              searchQuery={this.state.searchQuery.q}
              countDatasets={
                datasetItems && datasetItems.hits
                  ? datasetItems.hits.total
                  : null
              }
              isFetchingDatasets={isFetchingDatasets}
              countTerms={
                termItems && termItems.hits ? termItems.hits.total : 0
              }
              isFetchingTerms={isFetchingTerms}
              open={this.open}
            />
            <ResultsTabs
              location={this.props.location}
              countDatasets={
                datasetItems && datasetItems.hits
                  ? datasetItems.hits.total
                  : null
              }
              countTerms={
                termItems && termItems.hits ? termItems.hits.total : 0
              }
              selectedLanguageCode={selectedLanguageCode}
            />
          </div>
        </section>
        <div className="container">
          <Switch>
            <Route
              exact
              path="/"
              render={props => (
                <ResultsDataset
                  selectedLanguageCode={this.props.selectedLanguageCode}
                  datasetItems={datasetItems}
                  onClearSearch={this.handleClearSearch}
                  onFilterTheme={this.handleDatasetFilterThemes}
                  onFilterAccessRights={this.handleDatasetFilterAccessRights}
                  onFilterPublisher={this.handleDatasetFilterPublisher}
                  onFilterPublisherHierarchy={
                    this.handleDatasetFilterPublisherHierarchy
                  }
                  onSort={this.handleDatasetSort}
                  onPageChange={this.handlePageChange}
                  searchQuery={this.state.searchQuery}
                  themesItems={themesItems}
                  showFilterModal={this.state.showFilterModal}
                  showClearFilterButton={
                    !!(
                      this.state.searchQuery.theme ||
                      this.state.searchQuery.accessrights ||
                      this.state.searchQuery.orgPath
                    )
                  }
                  closeFilterModal={this.close}
                  hitsPerPage={50}
                  publisherArray={publisherCountItems}
                  publishers={publisherItems}
                  {...props}
                />
              )}
            />
            <Route
              exact
              path="/concepts/:lang?"
              render={props => (
                <ResultsConcepts
                  selectedLanguageCode={this.props.selectedLanguageCode}
                  termItems={termItems}
                  onClearSearch={this.handleClearSearch}
                  onPageChange={this.handlePageChange}
                  onFilterPublisherHierarchy={
                    this.handleDatasetFilterPublisherHierarchy
                  }
                  searchQuery={this.state.searchQuery}
                  hitsPerPage={50}
                  showFilterModal={this.state.showFilterModal}
                  closeFilterModal={this.close}
                  showClearFilterButton={!!this.state.searchQuery.orgPath}
                  publisherArray={publisherCountTermItems}
                  publishers={publisherItems}
                  {...props}
                />
              )}
            />
          </Switch>
        </div>
      </div>
    );
  }
}

SearchPage.defaultProps = {
  selectedLanguageCode: null
};

SearchPage.propTypes = {
  selectedLanguageCode: PropTypes.string
};

const mapStateToProps = ({ datasets, terms, themes, publishers }) => {
  const {
    datasetItems,
    publisherCountItems,
    isFetchingDatasets
  } = datasets || {
    datasetItems: null,
    publisherCountItems: null
  };

  const { termItems, publisherCountTermItems, isFetchingTerms } = terms || {
    termItems: null,
    publisherCountTermItems: null
  };

  const { themesItems, isFetchingThemes } = themes || {
    themesItems: null
  };

  const { publisherItems, isFetchingPublishers } = publishers || {
    publisherItems: null
  };

  return {
    datasetItems,
    publisherCountItems,
    isFetchingDatasets,
    termItems,
    publisherCountTermItems,
    isFetchingTerms,
    themesItems,
    isFetchingThemes,
    publisherItems,
    isFetchingPublishers
  };
};

const mapDispatchToProps = dispatch => ({
  fetchDatasetsIfNeeded: url => dispatch(fetchDatasetsIfNeeded(url)),
  fetchTermsIfNeeded: url => dispatch(fetchTermsIfNeeded(url)),
  fetchThemesIfNeeded: () => dispatch(fetchThemesIfNeeded()),
  fetchPublishersIfNeeded: () => dispatch(fetchPublishersIfNeeded())
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchPage);
