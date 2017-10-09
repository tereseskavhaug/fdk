import * as React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import DatasetDescription from '../../components/search-dataset-description';
import DatasetKeyInfo from '../../components/search-dataset-keyinfo';
import DatasetDistribution from '../../components/search-dataset-distribution';
import DatasetInfo from '../../components/search-dataset-info';
import DatasetQuality from '../../components/search-dataset-quality-content';
import DatasetBegrep from '../../components/search-dataset-begrep';

export default class DetailsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataset: {},
      loading: true
    };
    this.loadDatasetFromServer = this.loadDatasetFromServer.bind(this);
  }

  componentDidMount() {
    this.loadDatasetFromServer();
  }

  // @params: the function has no param but the query need dataset id from prop
  // loads all the info for this dataset
  loadDatasetFromServer() {
    const url = `/detail?id=${this.props.params.id}`;
    axios.get(url)
      .then((res) => {
        const data = res.data;
        const dataset = data.hits.hits[0]._source;
        // ##### MOCK DATA START - please remove when backend is fixed;
        dataset.type = 'Kodelister';
        dataset.conformsTo = ['SOSI'];
        dataset.legalBasisForRestrictions = [
          {
            source: 'http://www.example.com/somepath/somelegalbasis',
            foafHomepage: null,
            prefLabel: {
              nb: 'Den spesifike loven '
            }
          },
          {
            source: 'http://www.example.com/somepath/someotherlegalbasis',
            foafHomepage: null,
            prefLabel: {
              nb: 'Den andre spesifike loven'
            }
          }
        ];
        dataset.legalBasisForProcessings = [
          {
            source: 'http://www.example.com/somepath/someotherlegalbasis',
            foafHomepage: null,
            prefLabel: {
              nb: 'a legalBasisForProcessings that has a long title'
            }
          }
        ];
        dataset.legalBasisForAccesses = [
          {
            source: 'http://www.example.com/somepath/someotherlegalbasis',
            foafHomepage: null,
            prefLabel: {
              nb: 'a legalBasisForAccesses that has a long title'
            }
          }
        ];
        // ### MOCK DATA END
        this.setState({
          dataset,
          loading: false
        });
      });
  }

  _renderDatasetDescription() {
    const dataset = this.state.dataset;
    if (dataset.description) {
      return (
        <DatasetDescription
          title={dataset.title ?
            dataset.title[this.props.selectedLanguageCode]
            || dataset.title.nb
            || dataset.title.nn
            || dataset.title.en
            : null
          }
          description={dataset.description ?
            dataset.description[this.props.selectedLanguageCode]
            || dataset.description.nb
            || dataset.description.nn
            || dataset.description.en
            : null
          }
          publisher={dataset.publisher}
          themes={dataset.theme}
          selectedLanguageCode={this.props.selectedLanguageCode}
        />
      );
    }
    return null;
  }

  _renderDistribution() {
    let distributionNodes;
    const { distribution } = this.state.dataset;
    if (distribution) {
      distributionNodes = distribution.map(distribution => (
        <DatasetDistribution
          id={encodeURIComponent(distribution.id)}
          key={encodeURIComponent(distribution.id)}
          description={distribution.description ?
            distribution.description[this.props.selectedLanguageCode]
            || distribution.description.nb
            || distribution.description.nn
            || distribution.description.en
            : null
          }
          accessUrl={distribution.accessURL}
          format={distribution.format}
          authorityCode={this.state.dataset.accessRights ? this.state.dataset.accessRights.authorityCode : null}
          selectedLanguageCode={this.props.selectedLanguageCode}
        />
      ));
    }
    return distributionNodes;
  }


  _renderKeyInfo() {
    if (this.state.dataset) {
      return (
        <DatasetKeyInfo
          authorityCode={this.state.dataset.accessRights ? this.state.dataset.accessRights.authorityCode : null}
          selectedLanguageCode={this.props.selectedLanguageCode}
          type={this.state.dataset.type}
          conformsTo={this.state.dataset.conformsTo}
          legalBasisForRestrictions={this.state.dataset.legalBasisForRestrictions}
          legalBasisForProcessings={this.state.dataset.legalBasisForProcessings}
          legalBasisForAccesses={this.state.dataset.legalBasisForAccesses}
        />
      );
    }
    return null;
  }

  _renderDatasetInfo() {
    const { accrualPeriodicity } = this.state.dataset;
    if (accrualPeriodicity) {
      return (
        <DatasetInfo
          issued={this.state.dataset.issued}
          accrualPeriodicity={
            accrualPeriodicity.prefLabel[this.props.selectedLanguageCode]
            || accrualPeriodicity.prefLabel.nb
            || accrualPeriodicity.prefLabel.nn
            || accrualPeriodicity.prefLabel.en
          }
          provenance={this.state.dataset.provenance ?
            this.state.dataset.provenance.prefLabel[this.props.selectedLanguageCode]
            || this.state.dataset.provenance.prefLabel.nb
            || this.state.dataset.provenance.prefLabel.nn
            || this.state.dataset.provenance.prefLabel.en
            : '-'
          }
          language={this.state.dataset.language ?
            this.state.dataset.language.prefLabel[this.props.selectedLanguageCode]
            || this.state.dataset.language.prefLabel.nb
            || this.state.dataset.language.prefLabel.nn
            || this.state.dataset.language.prefLabel.en
            : '-'
          }
        />
      );
    }
    return null;
  }

  render() {
    /*
     <div className="fdk-container-detail fdk-container-detail-header">
     <i className="fa fa-book fdk-fa-left fdk-color-cta" />Begrep
     </div>
     <DatasetBegrep
     title="Jordsmonn"
     description="Dette er Kartverket sin korte og presise definisjon av begrepet Dette er Kartverket sin korte og presise definisjon av begrepet Dette er Kartverket sin korte og presise definisjon av begrepet"
     />
     */
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-8 col-md-offset-2">
            {this._renderDatasetDescription()}


            {this._renderKeyInfo()}

            {this._renderDistribution()}

            {this._renderDatasetInfo()}

            <DatasetQuality
              header="Kvalitet på innhold"
              relevans="-"
              kompletthet="-"
              noyaktighet="-"
              tilgjengelighet="-"
            />

          </div>
        </div>
      </div>
    );
  }
}

DetailsPage.propTypes = {
  id: PropTypes.string,
  params: PropTypes.object,
  selectedLanguageCode: PropTypes.string
};