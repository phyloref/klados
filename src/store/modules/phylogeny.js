/*
 * Store module for modifying phylogenies.
 */

import Vue from 'vue';
import { parse as parseNewick } from 'newick-js';
import { has } from 'lodash';

export default {
  getters: {
    getNodeLabelsFromNewick: (state, getters) => (newick, nodeType = 'both') => {
      // Return a list of all the node labels in this phylogeny.
      //
      // nodeType can be one of:
      // - 'internal': Return node labels on internal nodes.
      // - 'terminal': Return node labels on terminal nodes.
      // - 'both': Return node labels on both internal and terminal nodes.

      // Parse the phylogeny (will throw an exception if parsing failed).
      const { graph } = parseNewick(newick || '()');
      const [vertices, arcs] = graph;

      if (nodeType === 'both') {
        // Return all node labels.
        return Array.from(
          new Set(
            Array.from(vertices)
              .map(vertex => vertex.label)
              .filter(label => label !== undefined),
          ),
        );
      }

      if (nodeType === 'internal') {
        // Return the internal nodes (those with atleast one child).
        return Array.from(new Set(
          Array.from(arcs)
            .map(arc => arc[0].label) // Retrieve the label of the parent vertex in this arc.
            .filter(label => label !== undefined),
        ));
      }

      if (nodeType === 'terminal') {
        // Return the terminal nodes. This would require calculating the children
        // of every vertex in the graph and then identifying vertices without any
        // children.
        //
        // A quicker and dirtier way to do this is by removing internal labels
        // from the list of all node labels. This will report an incorrect result
        // if an internal node has the same label as a terminal node, but at that
        // point a lot of other assumptions are going to fail, too, so this is
        // probably good enough for now.
        const allLabels = getters.getNodeLabelsFromNewick(newick, 'both');
        const internalLabels = new Set(getters.getNodeLabelsFromNewick(newick, 'internal'));

        return allLabels.filter(label => !internalLabels.has(label));
      }

      throw new Error(`Unknown nodeType: '${nodeType}'`);
    },

    getTaxonomicUnitsForNodeLabel: (state, getters) => (phylogeny, nodeLabel) => {
      // Return a list of taxonomic units for a node label.

      // Look up additional node properties.
      let additionalNodeProperties = {};
      if (
        has(phylogeny, 'additionalNodeProperties')
        && has(phylogeny.additionalNodeProperties, nodeLabel)
      ) {
        additionalNodeProperties = phylogeny.additionalNodeProperties[nodeLabel];
      }

      // If there are explicit taxonomic units in the
      // representsTaxonomicUnits property, we need to use those.
      if (has(additionalNodeProperties, 'representsTaxonomicUnits')) {
        return additionalNodeProperties.representsTaxonomicUnits;
      }

      // If that doesn't work, we can try to extract scientific names from
      // the node label. Note that taxonomic units will NOT be extracted from
      // the label if there is a taxonomic unit present!
      return getters.getTaxonomicUnitsFromNodeLabel(nodeLabel.trim());
    },

    getTaxonomicUnitsFromNodeLabel: () => (nodeLabel) => {
      // Given a node label, attempt to parse it as a scientific name.
      // Returns a list of taxonomic units.
      //
      // TODO memoize this
      if (nodeLabel === undefined || nodeLabel === null) return [];

      // Check if the label starts with a binomial name.
      let tunits = [];
      const results = /^([A-Z][a-z]+)[ _]([a-z-]+)(?:\b|_)\s*(.*)/.exec(nodeLabel);
      if (results !== null) {
        tunits = [{
          scientificNames: [{
            scientificName: `${results[1]} ${results[2]} ${results[3]}`.trim(),
            binomialName: `${results[1]} ${results[2]}`,
            genus: results[1],
            specificEpithet: results[2],
          }],
        }];
      } else {
        // It may be a scientific name, but we don't know how to parse it as such.
        tunits = [];
      }

      return tunits;
    },

    getNodeLabelsMatchedBySpecifier: (state, getters) => (phylogeny, specifier) => {
      // Return a list of node labels matched by a given specifier on
      // a given phylogeny.

      // Does the specifier have any taxonomic units? If not, we can't
      // match anything!
      if (!has(specifier, 'referencesTaxonomicUnits')) { return []; }
      const specifierTUnits = specifier.referencesTaxonomicUnits;

      return getters.getNodeLabelsFromNewick(phylogeny.newick || '()').filter((nodeLabel) => {
        // Find all the taxonomic units associated with the specifier and
        // with the node.
        const nodeTUnits = getters.getTaxonomicUnitsForNodeLabel(phylogeny, nodeLabel);

        // Attempt pairwise matches between taxonomic units in the specifier
        // and associated with the node.
        return specifierTUnits.some(tunit1 =>
          nodeTUnits.some(tunit2 => new TaxonomicUnitMatcher(tunit1, tunit2).matched));
      });
    },
  },
  mutations: {
    setPhylogenyProps(state, payload) {
      if (!has(payload, 'phylogeny')) {
        throw new Error('setPhylogenyProps needs a phylogeny to modify using the "phylogeny" argument');
      }
      if (has(payload, 'label')) {
        Vue.set(payload.phylogeny, 'label', payload.label);
      }
      if (has(payload, 'description')) {
        Vue.set(payload.phylogeny, 'description', payload.description);
      }
      if (has(payload, 'newick')) {
        Vue.set(payload.phylogeny, 'newick', payload.newick);
      }
    },
  },
};
