import React from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import sa from 'superagent';
import {
  SearchkitManager,
  SearchkitProvider,
  RefinementListFilter,
  Hits,
  HitsStats,
  Pagination,
  SortingSelector,
  TopBar
} from 'searchkit';

import { QueryTransport } from '../../utils/QueryTransport';
import localization from '../localization';
import RefinementOptionThemes from '../search-refinementoption-themes';
import RefinementOptionPublishers from '../search-refinementoption-publishers';
import { SearchBox } from '../search-results-searchbox';
import SearchHitItem from '../search-results-hit-item';
import SelectDropdown from '../search-results-selector-dropdown';
import CustomHitsStats from '../search-result-custom-hitstats';
import createHistory from 'history/createBrowserHistory'
import { addOrReplaceParam } from '../../utils/addOrReplaceUrlParam';

const host = '/dcat';

const history = createHistory()
// history.push();
// history.replace();
console.log('history is ', history);
history.default = () => {
  console.log('default func?');
}
// history.replace(path, [state])


const searchkit = new SearchkitManager(
  host,
  {
    transport: new QueryTransport(),
    createHistory: ()=> {
      console.log('create history runs now');
      return history;
    }

  }
);
function getURLParameters(paramName)
{
  const sURL = window.location.search.toString();
  console.log('sURL is ', sURL);
  if (sURL.indexOf("?") > 0)
  {
    const arrParams = sURL.split("?");
    const arrURLParams = arrParams[1].split("&");
    const arrParamNames = new Array(arrURLParams.length);
    const arrParamValues = new Array(arrURLParams.length);

    let i = 0;
    for (i = 0; i<arrURLParams.length; i++)
    {
      const sParam =  arrURLParams[i].split("=");
      arrParamNames[i] = sParam[0];
      if (sParam[1] != "")
        arrParamValues[i] = unescape(sParam[1]);
      else
        arrParamValues[i] = "No Value";
    }

    for (i=0; i<arrURLParams.length; i++)
    {
      if (arrParamNames[i] == paramName)
      {
        // alert("Parameter:" + arrParamValues[i]);
        return arrParamValues[i];
      }
    }
    return "No Parameters Found";
  }
}
searchkit.translateFunction = (key) => {
  const translations = {
    'pagination.previous': localization.page.prev,
    'pagination.next': localization.page.next,
    'facets.view_more': localization.page.viewmore,
    'facets.view_all': localization.page.seeall,
    'facets.view_less': localization.page.seefewer,
    'reset.clear_all': localization.page.resetfilters,
    'hitstats.results_found': `${localization.page['result.summary']} {numberResults} ${localization.page.dataset}`,
    'NoHits.Error': localization.noHits.error,
    'NoHits.ResetSearch': '.',
    'sort.by': localization.sort.by,
    'sort.relevance': localization.sort.relevance,
    'sort.title': localization.sort.title,
    'sort.publisher': localization.sort.publisher,
    'sort.modified': localization.sort.modified
  };
  return translations[key];
};

export default class ResultsDataset extends React.Component {
  constructor(props) {
    super(props);
    this.queryObj = qs.parse(window.location.search.substr(1));
    if (!window.themes) {
      window.themes = [];

      sa.get('/reference-data/themes')
        .end((err, res) => {
          if (!err && res) {
            res.body.forEach((hit) => {
              const obj = {};
              obj[hit.code] = {};
              obj[hit.code].nb = hit.title.nb;
              obj[hit.code].nn = hit.title.nb;
              obj[hit.code].en = hit.title.en;
              window.themes.push(obj);
            });
          }
        });
    }
  }

  _renderPublisherRefinementListFilter() {
    this.publisherFilter =
      (<RefinementListFilter
        id="publisher"
        title={localization.facet.organisation}
        field="publisher.name.raw"
        operator="AND"
        size={5/* NOT IN USE!!! see QueryTransport.jsx */}
        itemComponent={RefinementOptionPublishers}
      />);

    return this.publisherFilter;
  }

  render() {
    const selectDropdownWithProps = React.createElement(SelectDropdown, {
      selectedLanguageCode: this.props.selectedLanguageCode
    });

    const searchHitItemWithProps = React.createElement(SearchHitItem, {
      selectedLanguageCode: this.props.selectedLanguageCode
    });

    history.listen((location, action)=> {
      console.log(action, location);
      /*
          location = {pathname: "/", search: "?theme[0]=Ukjent", hash: "", state: undefined, key: "tk0fqa"}
        */

      if(location.search.indexOf('lang=') === -1 && this.props.selectedLanguageCode && this.props.selectedLanguageCode !== "nb") {
        let nextUrl = "";
        if (location.search.indexOf('?') === -1) {
          nextUrl = `${location.search  }?lang=${   this.props.selectedLanguageCode}`
        } else {
          nextUrl = `${location.search  }&lang=${   this.props.selectedLanguageCode}`
        }
        history.push(nextUrl);
      }
    });
    return (
      <SearchkitProvider searchkit={searchkit}>
        <div>
          <div className="container">
            <div className="row mb-60">
              <div className="col-md-12">
                <TopBar>
                  <SearchBox
                    autofocus
                    searchOnChange={false}
                    placeholder={localization.query.intro}
                  />
                </TopBar>
              </div>
              <div className="col-md-12 text-center">
                <HitsStats component={CustomHitsStats} />
              </div>
            </div>
            <section id="resultPanel">
              <div className="row">
                <div className="col-md-4 col-md-offset-8">
                  <div className="pull-right">
                    <SortingSelector
                      tabIndex="0"
                      options={[
                        {
                          label: 'sort.relevance',
                          field: '_score',
                          order: 'asc',
                          defaultOption: true
                        },
                        {
                          label: `sort.title`,
                          field: 'title',
                          order: 'asc'
                        },
                        {
                          label: `sort.modified`,
                          field: 'modified',
                          order: 'desc'
                        },
                        {
                          label: `sort.publisher`,
                          field: 'publisher.name',
                          order: 'asc'
                        }
                      ]}
                      listComponent={selectDropdownWithProps}
                    />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="search-filters col-sm-4 flex-move-first-item-to-bottom">
                  <RefinementListFilter
                    id="theme"
                    title={localization.facet.theme}
                    field="theme.code.raw"
                    operator="AND"
                    size={5}
                    itemComponent={RefinementOptionThemes}
                  />
                  <RefinementListFilter
                    id="accessRight"
                    title={localization.facet.accessRight}
                    field="accessRights.authorityCode.raw"
                    operator="AND"
                    size={5/* NOT IN USE!!! see QueryTransport.jsx */}
                    itemComponent={RefinementOptionPublishers}
                  />
                  {this._renderPublisherRefinementListFilter()}
                </div>
                <div id="datasets" className="col-sm-8">
                  <Hits
                    mod="sk-hits-grid"
                    hitsPerPage={50}
                    itemComponent={searchHitItemWithProps}
                    sourceFilter={['title', 'description', 'keyword', 'catalog', 'theme', 'publisher', 'contactPoint', 'distribution']}
                  />
                  <Pagination
                    showNumbers
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </SearchkitProvider>
    );
  }
}

ResultsDataset.defaultProps = {
  selectedLanguageCode: null
};

ResultsDataset.propTypes = {
  selectedLanguageCode: PropTypes.string
};
