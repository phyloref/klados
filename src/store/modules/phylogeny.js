/*
 * Store module for modifying phylogenies.
 */

import Vue from 'vue';
import { has, findIndex, isEqual, keys, cloneDeep } from 'lodash';
import {PhylogenyWrapper} from "@phyloref/phyx";

// A helper function for comparing two taxonomic units.
function areTUnitsIdentical(tunit1, tunit2) {
  return isEqual(tunit1, tunit2);
}

export default {
  getters: {
    getExplicitTaxonomicUnitsForPhylogenyNode: () => (phylogeny, nodeLabel) => {
      // Return true if this node label in this phylogeny has a
      if (has(phylogeny, 'additionalNodeProperties')
          && has(phylogeny.additionalNodeProperties, nodeLabel)
          && has(phylogeny.additionalNodeProperties[nodeLabel], 'representsTaxonomicUnits')) {
        return phylogeny.additionalNodeProperties[nodeLabel].representsTaxonomicUnits;
      }
      return [];
    },
    areTUnitsIdentical: () => (tunit1, tunit2) => {
      return this.areTUnitsIdentical(tunit1, tunit2);
    }
  },
  mutations: {
    /** Set the additionalNodeProperties for a particular node label on a particular phylogeny. */
    setPhylogenyAdditionalProps(state, payload) {
      if (!has(payload, 'phylogeny')) {
        throw new Error('setPhylogenyAdditionalProps needs a phylogeny to modify using the "phylogeny" argument');
      }
      if (!has(payload, 'nodeLabel')) {
        throw new Error('setPhylogenyAdditionalProps needs a node label to modify using the "nodeLabel" argument');
      }
      if (!has(payload, 'content')) {
        throw new Error('setPhylogenyAdditionalProps needs content to set using the "content" argument');
      }

      if (!has(payload.phylogeny, 'additionalNodeProperties'))
        Vue.set(payload.phylogeny, 'additionalNodeProperties', {});

      Vue.set(payload.phylogeny.additionalNodeProperties, payload.nodeLabel, payload.content);
    },
    /**
     * Replace or delete a taxonomic unit from a phylogeny node.
     */
    replaceTUnitForPhylogenyNode(state, payload) {
      if (!has(payload, 'phylogeny')) {
        throw new Error('replaceTUnitForPhylogenyNode needs a phylogeny to modify using the "phylogeny" argument');
      }
      if (!has(payload, 'nodeLabel')) {
        throw new Error('replaceTUnitForPhylogenyNode needs a node label to modify using the "nodeLabel" argument');
      }
      if (!has(payload, 'tunit')) {
        throw new Error('replaceTUnitForPhylogenyNode needs a tunit to delete using the "tunit" argument');
      }
      if (!has(payload, 'tunit_new') && !has(payload, 'delete')) {
        throw new Error(
          "replaceTUnitForPhylogenyNode needs either a `tunit_new` to replace the tunit or `delete` to indicate it should be deleted."
        );
      }

      console.log(
        "Tried to replace or delete tunit: ", payload.tunit, " from phylogeny ", payload.phylogeny, " at node label ", payload.nodeLabel
      );
      if (!has(payload.phylogeny, 'additionalNodeProperties')) {
        console.error("Could not replace or delete: no additionalNodeProperties present in phylogeny.");
        return;
      }

      if (!has(payload.phylogeny.additionalNodeProperties, payload.nodeLabel)) {
        console.error("Could not replace or delete: node label ", payload.nodeLabel, " not present in phylogeny.");
        return;
      }

      if (!has(payload.phylogeny.additionalNodeProperties[payload.nodeLabel], 'representsTaxonomicUnits')) {
        console.error("Could not replace or delete: node label ", payload.nodeLabel, " does not have a representsTaxonomicUnits.");
        return;
      }

      const tunits =
        payload.phylogeny.additionalNodeProperties[payload.nodeLabel]
          .representsTaxonomicUnits;
      const index = findIndex(tunits, (tu) =>
        areTUnitsIdentical(payload.tunit, tu)
      );

      if (index < 0) {
        console.error("Could not replace or delete: tunit ", payload.tunit, " as it is not present in tunits: ", tunits);
        return;
      }

      // Delete or replace?
      if (has(payload, 'delete')) {
        tunits.splice(index, 1);
      } else if (has(payload, 'tunit_new')) {
        tunits.splice(index, 1, payload.tunit_new);
      } else {
        console.error(
          "Neither `delete` nor `tunit_new` was set in payload, which should have been checked earlier: ",
          payload
        );
        return;
      }
    },
    setPhylogenyProps(state, payload) {
      if (!has(payload, 'phylogeny')) {
        throw new Error('setPhylogenyProps needs a phylogeny to modify using the "phylogeny" argument');
      }
      if (has(payload, 'label')) {
        Vue.set(payload.phylogeny, 'label', payload.label);
      }
      if (has(payload, 'curatorNotes')) {
        Vue.set(payload.phylogeny, 'curatorNotes', payload.curatorNotes);
      }
      if (has(payload, 'newick')) {
        Vue.set(payload.phylogeny, 'newick', payload.newick);
      }
      if (has(payload, '@id')) {
        Vue.set(payload.phylogeny, '@id', payload['@id']);
      }
    },
  },
  actions: {
    changePhylogenyId(context, payload) {
      // When changing a phylogeny ID, care needs to be taken to ensure that:
      //  (1) duplicate phylogeny IDs are not created within the same file, and
      //  (2) all current references to this phylogeny continue to make sense.

      // Check arguments.
      if (!has(payload, 'phylogeny')) {
        throw new Error('changePhylogenyId needs a phylogeny to modify using the "phylogeny" argument');
      }

      if (!has(payload, 'phylogenyId')) {
        throw new Error('changePhylogenyId needs a new phylogeny ID using the "phylogenyId" argument');
      }

      // What was the previous phylogeny ID?
      const oldPhylogenyId = context.rootGetters.getPhylogenyId(payload.phylogeny);

      // No need to do anything if they haven't changed.
      if (oldPhylogenyId === payload.phylogenyId) return;

      // Do any of our current phylogenies have this ID?
      const phylogenyWithDuplicateID = context.rootState.phyx.currentPhyx.phylogenies.find(phylogeny => has(phylogeny, '@id') && phylogeny['@id'] === payload.phylogenyId);
      if (phylogenyWithDuplicateID) {
        throw new Error(`Attempt to change ${oldPhylogenyId} to ${payload.phylogenyId} failed: duplicate phylogeny ID detected.`);
      }

      // If any phyloreferences refer to oldPhylogenyId, replace it with
      // references to the new phylogenyId.
      context.rootState.phyx.currentPhyx.phylorefs.forEach((phyloref) => {
        if (has(phyloref.expectedResolution || {}, oldPhylogenyId)) {
          // Copy the expected resolution of oldPhylogenyId into the new phylogenyId.
          context.commit('setPhylorefProps', {
            phyloref,
            phylogenyId: payload.phylogenyId,
            expectedResolution: phyloref.expectedResolution[oldPhylogenyId],
          });
          // Delete the expected resolution of oldPhylogenyId.
          context.commit('setPhylorefProps', {
            phyloref,
            phylogenyId: oldPhylogenyId,
            expectedResolution: undefined,
          });
        }
      });

      // Change the phylogeny.
      context.commit('setPhylogenyProps', {
        phylogeny: payload.phylogeny,
        '@id': payload.phylogenyId,
      });
    },
  },
};
