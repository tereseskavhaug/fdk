import React from 'react';
import { Field, FieldArray, reduxForm } from 'redux-form';
import { connect } from 'react-redux'

import localization from '../../utils/localization';
import Helptext from '../reg-form-helptext';
import InputField from '../reg-form-field-input';
import InputTagsField from '../reg-form-field-input-tags';
import TextAreaField from '../reg-form-field-textarea';
import RadioField from '../reg-form-field-radio';
import asyncValidate from '../../utils/asyncValidate';
import { textType, licenseType } from '../../schemaTypes';
import { validateMinTwoChars, validateLinkReturnAsSkosType, validateURL } from '../../validation/validation';

const validate = values => {
  const errors = {}
  const { sample } = values;
  let errorNodes = null;
  let conformsToNodes = null;

  if (sample) {
    errorNodes = sample.map(item => {
      let errors = {}

      const accessURL = item.accessURL ? item.accessURL : null;
      const license = (item.license && item.license.uri) ? item.license.uri : null;
      const description = (item.description && item.description.nb) ? item.description.nb : null;
      const page = (item.page && item.page[0] && item.page[0].uri) ? item.page[0].uri : null;
      const { conformsTo } = item || null;

      errors = validateURL('accessURL', accessURL, errors, true);
      errors = validateMinTwoChars('license', license, errors, 'uri');
      errors = validateMinTwoChars('description', description, errors);
      errors = validateLinkReturnAsSkosType('page', page, errors, 'uri');

      if (conformsTo) {
        conformsToNodes = conformsTo.map((item, index) => {
          let itemErrors = {}
          const conformsToPrefLabel = (item.prefLabel && item.prefLabel.nb) ? item.prefLabel.nb : null;
          const conformsToURI = item.uri ? item.uri : null;
          itemErrors = validateMinTwoChars('prefLabel', conformsToPrefLabel, itemErrors);
          itemErrors = validateURL('uri', conformsToURI, itemErrors);
          return itemErrors;
        });
        let showSyncError = false;
        conformsToNodes.map(item => {
          if (JSON.stringify(item) !== '{}') {
            showSyncError = true;
          }
        });
        if (showSyncError) {
          errors.conformsTo = conformsToNodes;
        }
      }
      return errors;
    });
    let showSyncError = false;
    errorNodes.map(item => {
      if (JSON.stringify(item) !== '{}') {
        showSyncError = true;
      }
    });
    if (showSyncError) {
      errors.sample = errorNodes;
    }
  }

  /*
   if (legalBasisForProcessing) {
   legalBasisForProcessingNodes = legalBasisForProcessing.map((item, index) => {
   let itemErrors = {}
   const legalBasisForProcessingPrefLabel = (item.prefLabel && item.prefLabel.nb) ? item.prefLabel.nb : null;
   const legalBasisForProcessingURI = item.uri ? item.uri : null;

   itemErrors = validateMinTwoChars('prefLabel', legalBasisForProcessingPrefLabel, itemErrors);
   itemErrors = validateURL('uri', legalBasisForProcessingURI, itemErrors);

   return itemErrors;
   });
   let showSyncError = false;
   legalBasisForProcessingNodes.map(item => {
   if (JSON.stringify(item) !== '{}') {
   showSyncError = true;
   }
   });
   if (showSyncError) {
   errors.legalBasisForProcessing = legalBasisForProcessingNodes;
   }
   }
   */

  // errors.sample = errorNodes;

  return errors
}

const renderSampleLandingpage = ({ fields }) => (
  <div>
    {fields.map((item, index) =>
      (<Field
        key={index}
        name={`${item}.uri`}
        component={InputField}
        label="Landingsside"
      />)
    )}
  </div>
);

const renderSamples = (props) => {
  const { fields, helptextItems } = props
  return (
    <div>
      {fields.map((sample, index) => (
        <div key={index}>
          <div className="form-group">
            <Helptext title="Type" helptextItems={helptextItems.Dataset_example} />
            <Field name={`${sample}.type`} radioId="sample-api" component={RadioField} type="radio" value="API" label="API" />
            <Field name={`${sample}.type`} radioId="sample-feed" component={RadioField} type="radio" value="Feed" label="Feed" />
            <Field name={`${sample}.type`} radioId="sample-file" component={RadioField} type="radio" value="Nedlastbar fil" label="Nedlastbar fil" />
          </div>
          <div className="form-group">
            <Helptext title="Tilgangs URL" helptextItems={helptextItems.Distribution_accessURL} />
            <Field
              name={`${sample}.accessURL.0`}
              type="text"
              component={InputField}
              label="Tilgangs URL"
            />
          </div>
          <div className="form-group">
            <Helptext title="Format" helptextItems={helptextItems.Distribution_format} />
            <Field
              name={`${sample}.format`}
              type="text"
              component={InputTagsField}
              label="Format"
            />
          </div>
          <div className="form-group">
            <Helptext title="Lisens" helptextItems={helptextItems.Distribution_modified} />
            <Field name={`${sample}.license.uri`} component={InputField} label="Lisens" />
          </div>
          <div className="form-group">
            <Helptext title="Beskrivelse" helptextItems={helptextItems.Distribution_description} />
            <Field name={`${sample}.description.nb`} component={TextAreaField} label="Beskrivelse" />
          </div>

          <div className="form-group">
            <Helptext
              title="Lenke til dokumentasjon av distribusjonen"
              helptextItems={helptextItems.Distribution_documentation}
            />
            <FieldArray
              name={`${sample}.page`}
              component={renderSampleLandingpage}
              helptextItems={helptextItems}
            />
          </div>

          <div className="form-group">
            <Helptext
              title="Standard"
              helptextItems={helptextItems.Distribution_conformsTo}
            />
            <div className="d-flex">
              <div className="w-50">
                <Field name={`${sample}.conformsTo[0].prefLabel.nb`} component={InputField} showLabel label="Tittel" />
              </div>
              <div className="w-50">
                <Field name={`${sample}.conformsTo[0].uri`} component={InputField} showLabel label="Lenke" />
              </div>
            </div>
          </div>
        </div>
      )
      )}
    </div>
  );
}

let FormSample = props => {
  const { helptextItems } = props;
  return (
    <form>
      <FieldArray
        name="sample"
        component={renderSamples}
        helptextItems={helptextItems}
      />
    </form>
  )
}

// Decorate with reduxForm(). It will read the initialValues prop provided by connect()
FormSample = reduxForm({
  form: 'sample',
  validate,
  asyncValidate,
})(FormSample)

const sampleTypes = values => {
  let samples  = null;
  if (values && values.length > 0) {
    samples = values.map(item => (
      {
        id: item.id ? item.id : '',
        description: item.description ? item.description : textType,
        accessURL: item.accessURL ? item.accessURL : [],
        license: item.license ? item.license : licenseType,
        conformsTo: item.conformsTo ? item.conformsTo : [],
        page: (item.page && item.page.length > 0) ? item.page : [{}],
        format: item.format ? item.format : [],
        type: item.type ? item.type : ''
      }
    ))
  } else {
    samples = [{
      id: '',
      description: textType,
      accessURL: [],
      license: licenseType,
      conformsTo: [],
      page: [],
      format: [],
      type: ''
    }]
  }
  return samples;
}

const mapStateToProps = ({ dataset }) => (
  {
    initialValues: {
      sample: sampleTypes(dataset.result.sample) || [{}]
    }
  }
)

export default connect(mapStateToProps)(FormSample)