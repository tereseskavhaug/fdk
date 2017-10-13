import React from 'react';
import DatasetDistribution from '../../../src/components/search-dataset-distribution';
import DatasetFormat from '../../../src/components/search-dataset-format';

describe('DatasetDistribution', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DatasetDistribution />);
  });

  it ('should render', () => {
    expect(wrapper).to.have.length(1);
    expect(wrapper.find('#dataset-distribution')).to.have.length(1);
  });

  it ('should render description', () => {
    wrapper.setProps({ description: 'description'});
    expect(wrapper.find('#dataset-distribution-description')).to.have.length(1);
  });

  it ('should render format', () => {
    wrapper.setProps({
      "format" : ['text/html', 'json']
    });
    expect(wrapper.find(DatasetFormat)).to.have.length(2);
  })

  it ('should render access url', () => {
    wrapper.setProps({ accessUrl: ['test-link', 'test-link-2']});
    expect(wrapper.find('#dataset-distribution-accessurl-0')).to.have.length(1);
    expect(wrapper.find('#dataset-distribution-accessurl-1')).to.have.length(1);
  });
});
