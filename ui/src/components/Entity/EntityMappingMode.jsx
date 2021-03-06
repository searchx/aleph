import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { csvContextLoader, SectionLoading } from 'src/components/common';
import { fetchEntityMapping } from 'src/actions';
import { selectEntityMapping } from 'src/selectors';
import { MappingEditor, MappingImportButton, MappingStatus } from 'src/components/MappingEditor/.';

import './EntityMappingMode.scss';

export class EntityMappingMode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      importedMappingData: null,
    };

    this.onImport = this.onImport.bind(this);
  }

  componentDidMount() {
    const { document, existingMapping } = this.props;

    if (document.id && existingMapping.shouldLoad) {
      this.props.fetchEntityMapping(document);
    }
  }

  onImport(mappingData) {
    const processedData = this.processImportedMappings(mappingData);

    this.setState({ importedMappingData: processedData });
  }

  processImportedMappings(mappingData) {
    const { columns } = this.props;

    const processed = {};
    Object.entries(mappingData).forEach(([id, { schema, keys, properties }]) => {
      const processedKeys = keys.filter(key => columns.indexOf(key) > -1);
      const processedProps = {};

      if (properties) {
        Object.entries(properties).forEach(([propName, propVal]) => {
          if (propVal.columns || (propVal.column && columns.indexOf(propVal.column) === -1)) {
            return;
          }
          if (propVal.literal && typeof propVal.literal === 'string') {
            processedProps[propName] = { literal: [propVal.literal] };
            return;
          }
          processedProps[propName] = propVal;
        });
      }

      processed[id] = {
        schema,
        keys: processedKeys,
        properties: processedProps,
      };
    });

    return processed;
  }

  render() {
    const { columns, document, existingMapping, rows } = this.props;
    const { importedMappingData } = this.state;

    if (!rows || !columns || existingMapping.isPending) {
      return <SectionLoading />;
    }

    const useFirstRowAsHeader = rows.length > 0 && columns[0] === 'Column 1';
    const showImport = !existingMapping.isPending && !importedMappingData && !existingMapping.id;

    return (
      <div className="EntityMappingMode">
        <div className="EntityMappingMode__title-container">
          <h1 className="text-page-title">
            <FormattedMessage id="mapping.title" defaultMessage="Generate structured entities" />
          </h1>
          <p className="text-page-subtitle">
            <FormattedMessage
              id="mapping.info"
              defaultMessage="Follow the steps below to map items in this dataset to structured Follow the Money entites. For more information, please refer to the {link}"
              values={{
                link: (
                  <a
                    href="https://docs.alephdata.org/developers/mappings"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FormattedMessage
                      id="mapping.infoLink"
                      defaultMessage="Aleph data mapping documentation"
                    />
                  </a>
                ),
              }}
            />
          </p>
        </div>

        {showImport && (
          <MappingImportButton onImport={this.onImport} />
        )}

        {existingMapping.id && (
          <MappingStatus
            mapping={existingMapping}
          />
        )}
        <MappingEditor
          document={document}
          csvData={useFirstRowAsHeader ? rows.slice(1) : rows}
          csvHeader={useFirstRowAsHeader ? rows[0] : columns}
          mappingData={importedMappingData || existingMapping?.query}
          existingMappingMetadata={existingMapping}
        />
      </div>
    );
  }
}

const mapDispatchToProps = { fetchEntityMapping };

const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;

  return {
    existingMapping: selectEntityMapping(state, document.id),
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
  csvContextLoader,
)(EntityMappingMode);
