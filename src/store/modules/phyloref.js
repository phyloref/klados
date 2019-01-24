/*
 * Store module for modifying phyloreferences.
 */

import Vue from 'vue';
import { has } from 'lodash';

export default {
  getters: {
    getExpectedNodeLabelsOnPhylogeny: (state, getters) => (phylogeny, phyloref) => {
      // Given a phylogeny, determine which node labels we expect this phyloref to
      // resolve to. To do this, we:
      //  1. Find all node labels that are case-sensitively identical
      //     to the phyloreference.
      //  2. Find all node labels that have additionalNodeProperties with
      //     expectedPhyloreferenceNamed case-sensitively identical to
      //     the phyloreference.
      const nodeLabels = new Set();
      const newick = phylogeny.newick || '()';

      // Can't do anything if no phyloref is provided or if it doesn't have a label.
      if (phyloref === undefined || !has(phyloref, 'label')) return [];
      const phylorefLabel = phyloref.label;

      getters.getNodeLabelsFromNewick(newick).forEach((nodeLabel) => {
        // Is this node label identical to the phyloreference name?
        if (nodeLabel === phylorefLabel) {
          nodeLabels.add(nodeLabel);
        } else if (
          has(phylogeny, 'additionalNodeProperties')
          && has(phylogeny.additionalNodeProperties, nodeLabel)
          && has(phylogeny.additionalNodeProperties[nodeLabel], 'expectedPhyloreferenceNamed')
        ) {
          // Does this node label have an expectedPhyloreferenceNamed that
          // includes this phyloreference name?

          const expectedPhylorefs = phylogeny
            .additionalNodeProperties[nodeLabel]
            .expectedPhyloreferenceNamed;

          if (expectedPhylorefs.includes(phylorefLabel)) {
            nodeLabels.add(nodeLabel);
          }
        }
      });

      // Return node labels sorted alphabetically.
      return Array.from(nodeLabels).sort();
    },

    getResolvedNodesForPhylogeny: state => (phyloref, phylogeny) => {
      // TODO implement!
      return [];
    },
  },
  mutations: {
    setPhylorefProps(state, payload) {
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

    // Modify specifier props.
    setSpecifierProps(state, payload) {
      if (!has(payload, 'specifier')) {
        throw new Error('setSpecifierProps needs a specifier to modify using the "specifier" argument');
      }
      if (has(payload, 'verbatimSpecifier')) {
        Vue.set(payload.specifier, 'label', payload.verbatimSpecifier);
      }
    },

    setSpecifierType(state, payload) {
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
      if (payload.specifierType === 'internal') {
        if (has(payload.phyloref, 'internalSpecifiers')) {
          payload.phyloref.internalSpecifiers.push(payload.specifier);
        } else {
          Vue.set(payload.phyloref, 'internalSpecifiers', [payload.specifier]);
        }
      } else if (payload.specifierType === 'external') {
        if (has(payload.phyloref, 'externalSpecifiers')) {
          payload.phyloref.externalSpecifiers.push(payload.specifier);
        } else {
          Vue.set(payload.phyloref, 'externalSpecifiers', [payload.specifier]);
        }
      } else {
        throw new Error(`Unknown specifier type: ${payload.specifierType}`);
      }
    },

    addToSpecifier(state, payload) {
      if (!has(payload, 'specifier')) {
        throw new Error('addToSpecifier needs a specifier to modify using the "specifier" argument');
      }
      if (has(payload, 'externalReference')) {
        if (!has(payload.specifier, 'externalReferences')) {
          Vue.set(payload.specifier, 'externalReferences', []);
        }

        payload.specifier.externalReferences.push(payload.externalReference);
      }
      if (has(payload, 'specimen')) {
        if (!has(payload.specifier, 'includesSpecimens')) {
          Vue.set(payload.specifier, 'includesSpecimens', []);
        }

        payload.specifier.includesSpecimens.push(payload.specimen);
      }
      if (has(payload, 'scientificName')) {
        if (!has(payload.specifier, 'scientificNames')) {
          Vue.set(payload.specifier, 'scientificNames', []);
        }

        payload.specifier.scientificNames.push(payload.scientificName);
      }
    },

    deleteFromSpecifier(state, payload) {
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
