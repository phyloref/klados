/*
 * Store module for modifying phyloreferences.
 */

import Vue from 'vue';
import { has, keys } from 'lodash';

export default {
  mutations: {
    setPhylorefProps(state, payload) {
      // Set one or more properties on a phyloreference.

      if (!has(payload, 'phyloref')) {
        throw new Error('setPhylorefProps needs a phyloref to modify using the "phyloref" argument');
      }
      if (has(payload, 'label')) {
        Vue.set(payload.phyloref, 'label', payload.label);
      }
      if (has(payload, 'cladeDefinition')) {
        Vue.set(payload.phyloref, 'cladeDefinition', payload.cladeDefinition);
      }
      if (has(payload, 'curatorComments')) {
        Vue.set(payload.phyloref, 'curatorComments', payload.curatorComments);
      }
    },

    addSpecifier(state, payload) {
      // Add an empty specifier to a particular phyloreference.

      if (!has(payload, 'phyloref')) {
        throw new Error('addSpecifier needs a phyloref to modify using the "phyloref" argument');
      }

      if (!has(payload.phyloref, 'externalSpecifiers')) {
        Vue.set(payload.phyloref, 'externalSpecifiers', []);
      }

      // TODO: remove when the model changes.
      payload.phyloref.externalSpecifiers.push({ referencesTaxonomicUnits: [{}] });
    },

    deleteSpecifier(state, payload) {
      // Delete a specifier from a phyloreference.

      if (!has(payload, 'phyloref')) {
        throw new Error('deleteSpecifier needs a phyloref to modify using the "phyloref" argument');
      }
      if (!has(payload, 'specifier')) {
        throw new Error('deleteSpecifier needs a specifier to delete using the "specifier" argument');
      }

      if (has(payload.phyloref, 'internalSpecifiers') && payload.phyloref.internalSpecifiers.includes(payload.specifier)) {
        payload.phyloref.internalSpecifiers.splice(
          payload.phyloref.internalSpecifiers.indexOf(payload.specifier),
          1,
        );
      }

      if (has(payload.phyloref, 'externalSpecifiers') && payload.phyloref.externalSpecifiers.includes(payload.specifier)) {
        payload.phyloref.externalSpecifiers.splice(
          payload.phyloref.externalSpecifiers.indexOf(payload.specifier),
          1,
        );
      }
    },

    setSpecifierProps(state, payload) {
      // Set one or more properties on a specifier.

      if (!has(payload, 'specifier')) {
        throw new Error('setSpecifierProps needs a specifier to modify using the "specifier" argument');
      }

      if (!has(payload, 'props')) {
        throw new Error('setSpecifierProps needs properties to set this specifier to using the "props" argument');
      }

      const specifier = payload.specifier;
      const props = payload.props;

      // Delete all existing keys in this specifier.
      keys(specifier).forEach(key => Vue.delete(specifier, key));

      // Add all new keys from the payload.
      keys(props).forEach(key => Vue.set(specifier, key, payload[key]));
    },

    setSpecifierType(state, payload) {
      // Change the type of a specifier. Since we maintain separate internalSpecifiers
      // and externalSpecifiers arrays, we may need to delete the specifier from one
      // array and add it to the other.

      if (!has(payload, 'phyloref')) {
        throw new Error('setSpecifierType needs a phyloref to modify using the "phyloref" argument');
      }
      if (!has(payload, 'specifier')) {
        throw new Error('setSpecifierType needs a specifier to modify using the "specifier" argument');
      }
      if (!has(payload, 'specifierType')) {
        throw new Error('setSpecifierType needs a specifierType to set to using the "specifierType" argument');
      }

      // Remove this specifier from this phyloreference.
      if (has(payload.phyloref, 'internalSpecifiers') && payload.phyloref.internalSpecifiers.includes(payload.specifier)) {
        payload.phyloref.internalSpecifiers.splice(
          payload.phyloref.internalSpecifiers.indexOf(payload.specifier),
          1,
        );
      }
      if (has(payload.phyloref, 'externalSpecifiers') && payload.phyloref.externalSpecifiers.includes(payload.specifier)) {
        payload.phyloref.externalSpecifiers.splice(
          payload.phyloref.externalSpecifiers.indexOf(payload.specifier),
          1,
        );
      }

      // Reinsert it into the correct place.
      if (payload.specifierType === 'Internal') {
        if (has(payload.phyloref, 'internalSpecifiers')) {
          payload.phyloref.internalSpecifiers.push(payload.specifier);
        } else {
          Vue.set(payload.phyloref, 'internalSpecifiers', [payload.specifier]);
        }
      } else if (payload.specifierType === 'External') {
        if (has(payload.phyloref, 'externalSpecifiers')) {
          payload.phyloref.externalSpecifiers.push(payload.specifier);
        } else {
          Vue.set(payload.phyloref, 'externalSpecifiers', [payload.specifier]);
        }
      } else {
        throw new Error(`Unknown specifier type: ${payload.specifierType}`);
      }
    },

    setSpecifierPart(state, payload) {
      // Replaces one or more specifier part with a new value. Note that values
      // can only be scientific names or occurrence IDs; external references use
      // updateSpecifierExternalReference().
      if (!has(payload, 'specifierPart')) {
        throw new Error('setSpecifierPart needs a specifier part to modify using the "specifierPart" argument');
      }

      if (has(payload, 'scientificName')) {
        Vue.set(payload.specifierPart, 'scientificName', payload.scientificName);
      }
      if (has(payload, 'occurrenceID')) {
        Vue.set(payload.specifierPart, 'occurrenceID', payload.occurrenceID);
      }
    },

    updateSpecifierExternalReference(state, payload) {
      // Given a specifier, replace one external reference with another.
      if (!has(payload, 'specifier')) {
        throw new Error('updateSpecifierExternalReference needs a specifier to modify using the "specifier" argument');
      }

      if (!has(payload.specifier, 'externalReferences')) {
        Vue.set(payload.specifier, 'externalReferences', []);
      }

      if (has(payload, 'fromExternalReference')) {
        if (payload.specifier.externalReferences.includes(payload.fromExternalReference)) {
          payload.specifier.externalReferences.splice(
            payload.specifier.externalReferences.indexOf(payload.fromExternalReference),
            1,
          );
        }
      }

      if (has(payload, 'toExternalReference')) {
        payload.specifier.externalReferences.push(payload.toExternalReference);
      }
    },

    addToSpecifier(state, payload) {
      // Add a new external reference, specimen or scientific name to a phyloreference.

      if (!has(payload, 'specifier')) {
        throw new Error('addToSpecifier needs a specifier to modify using the "specifier" argument');
      }

      // Add external reference (if one is provided).
      if (has(payload, 'externalReference')) {
        if (!has(payload.specifier, 'externalReferences')) {
          Vue.set(payload.specifier, 'externalReferences', []);
        }

        payload.specifier.externalReferences.push(payload.externalReference);
      }

      // Add specimen (if one is provided).
      if (has(payload, 'specimen')) {
        if (!has(payload.specifier, 'includesSpecimens')) {
          Vue.set(payload.specifier, 'includesSpecimens', []);
        }

        payload.specifier.includesSpecimens.push(payload.specimen);
      }

      // Add scientific name (if one is provided).
      if (has(payload, 'scientificName')) {
        if (!has(payload.specifier, 'scientificNames')) {
          Vue.set(payload.specifier, 'scientificNames', []);
        }

        payload.specifier.scientificNames.push(payload.scientificName);
      }
    },

    deleteFromSpecifier(state, payload) {
      // Delete a scientific name, specimen or external reference from a given specifier.

      if (!has(payload, 'specifier')) {
        throw new Error('deleteFromSpecifier needs a specifier to modify using the "specifier" argument');
      }
      if (has(payload, 'scientificName')) {
        if (!has(payload.specifier, 'scientificNames')) Vue.set(payload.specifier, 'scientificNames', []);
        if (payload.specifier.scientificNames.includes(payload.scientificName)) {
          payload.specifier.scientificNames.splice(
            payload.specifier.scientificNames.indexOf(payload.scientificName),
            1,
          );
        }
      }
      if (has(payload, 'specimen')) {
        if (!has(payload.specifier, 'includesSpecimens')) Vue.set(payload.specifier, 'includesSpecimens', []);
        if (payload.specifier.includesSpecimens.includes(payload.specimen)) {
          payload.specifier.includesSpecimens.splice(
            payload.specifier.includesSpecimens.indexOf(payload.specimen),
            1,
          );
        }
      }
      if (has(payload, 'externalReference')) {
        if (!has(payload.specifier, 'externalReferences')) Vue.set(payload.specifier, 'externalReferences', []);
        if (payload.specifier.externalReferences.includes(payload.externalReference)) {
          payload.specifier.externalReferences.splice(
            payload.specifier.externalReferences.indexOf(payload.externalReference),
            1,
          );
        }
      }
    },
  },
};
