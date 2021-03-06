import React from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import TagsInput from 'react-tagsinput';
import AutosizeInput from 'react-input-autosize';
import _ from 'lodash';

import { getConceptByTitlePrefix } from '../../../../api/get-concept-by-title-prefix';
import getTranslateText from '../../../../utils/translateText';
import '../../../../components/field-input-tags/field-input-tags.scss';

const updateInput = (updates, props) => {
  const { input } = props;
  let inputValues = input.value;
  if (!inputValues) {
    inputValues = [];
  }
  inputValues.push(updates);
  input.onChange(inputValues);
};

const handleChange = (props, tags, changed, changedIndexes) => {
  const { input } = props;

  // hvis changedIndex er mindre enn lengden av input.value, da fjerne den indeksen, hvis større så legge til
  const valueLength = input.value.length;
  const updates = input.value;

  if (changedIndexes < valueLength) {
    // skal fjerne en tag på gitt index
    updates.splice(changedIndexes[0], 1);
    input.onChange(updates);
  } else if (typeof changed[0] === 'object') {
    // skal legge til en ny tag
    updateInput(changed[0], props);
  }
};

const renderSuggestion = suggestion => (
  <div className="d-flex mb-3">
    <span className="w-25">
      {getTranslateText(_.get(suggestion, 'prefLabel'))}
    </span>
    <span className="w-75 ml-5">
      {getTranslateText(_.get(suggestion, ['definition', 'text']))}
    </span>
  </div>
);

const getSuggestionValue = suggestion =>
  getTranslateText(_.get(suggestion, 'prefLabel'));

class InputTagsFieldConcepts extends React.Component {
  constructor() {
    super();

    this.state = {
      suggestions: [],
      isLoading: false
    };

    this.lastRequestId = null;
    this.loadSuggestions = this.loadSuggestions.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(
      this
    );
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(
      this
    );
    this.autosuggestRenderInput = this.autosuggestRenderInput.bind(this);
  }

  onSuggestionsFetchRequested({ value }) {
    this.loadSuggestions(value);
  }

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: []
    });
  }

  loadSuggestions(value) {
    const returnFields = 'uri,definition.text';
    // Cancel the previous request
    if (this.lastRequestId !== null) {
      clearTimeout(this.lastRequestId);
    }

    this.setState({
      isLoading: true
    });

    const concepts = [];

    getConceptByTitlePrefix(value, returnFields)
      .then(responseData => {
        _.get(responseData, ['_embedded', 'concepts'], []).forEach(item => {
          concepts.push(item);
        });
        this.lastRequestId = setTimeout(() => {
          this.setState({
            isLoading: false,
            suggestions: concepts
          });
        }, 1000);
      })
      .catch(error => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('error', error); // eslint-disable-line no-console
        }
      });
  }

  autosuggestRenderInput({ addTag, ...props }) {
    const handleOnChange = (e, { method }) => {
      if (method === 'enter') {
        e.preventDefault();
      } else {
        props.onChange(e);
      }
    };

    const autosizingRenderInput = ({ addTag, ...componentProps }) => {
      const { onChange, value, ...other } = componentProps;
      return (
        <AutosizeInput
          type="text"
          onChange={onChange}
          value={value}
          {...other}
        />
      );
    };

    const { suggestions, isLoading } = this.state;

    return (
      <React.Fragment>
        <Autosuggest
          ref={props.ref}
          suggestions={suggestions}
          shouldRenderSuggestions={value => value && value.trim().length > 1}
          getSuggestionValue={suggestion => getSuggestionValue(suggestion)}
          renderSuggestion={suggestion => renderSuggestion(suggestion)}
          inputProps={{ ...props, onChange: handleOnChange }}
          onSuggestionSelected={(e, { suggestion }) => {
            addTag(suggestion);
          }}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          renderInputComponent={autosizingRenderInput}
        />
        {isLoading && (
          <i
            className="fa fa-spinner fa-spin"
            style={{ position: 'absolute', right: '10px', top: '12px' }}
          />
        )}
      </React.Fragment>
    );
  }

  render() {
    const { input, label, showLabel } = this.props;
    let tagNodes = [];

    if (input && input.value && input.value.length > 0) {
      tagNodes = input.value.map(item => getTranslateText(item.prefLabel));
    }
    return (
      <div className="pl-2">
        <label className="fdk-form-label w-100" htmlFor={input.name}>
          {showLabel ? label : null}
          <div className="d-flex align-items-center">
            <TagsInput
              value={tagNodes}
              className="fdk-reg-input-tags"
              inputProps={{ placeholder: '' }}
              onChange={(tags, changed, changedIndexes) => {
                handleChange(this.props, tags, changed, changedIndexes);
              }}
              renderInput={this.autosuggestRenderInput}
            />
          </div>
        </label>
      </div>
    );
  }
}

InputTagsFieldConcepts.defaultProps = {
  showLabel: false,
  input: null,
  label: null
};

InputTagsFieldConcepts.propTypes = {
  showLabel: PropTypes.bool,
  input: PropTypes.object,
  label: PropTypes.string
};

export default InputTagsFieldConcepts;
