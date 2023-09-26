/*
 * Store module for modifying phylogenies.
 */

import Vue from "vue";
import { has, keys, cloneDeep } from "lodash";

export default {
  mutations: {
    setPhylogenyProps(state, payload) {
      if (!has(payload, "phylogeny")) {
        throw new Error(
          'setPhylogenyProps needs a phylogeny to modify using the "phylogeny" argument'
        );
      }
      if (has(payload, "label")) {
        Vue.set(payload.phylogeny, "label", payload.label);
      }
      if (has(payload, "curatorNotes")) {
        Vue.set(payload.phylogeny, "curatorNotes", payload.curatorNotes);
      }
      if (has(payload, "newick")) {
        Vue.set(payload.phylogeny, "newick", payload.newick);
      }
      if (has(payload, "@id")) {
        Vue.set(payload.phylogeny, "@id", payload["@id"]);
      }
    },
  },
  actions: {
    changePhylogenyId(context, payload) {
      // When changing a phylogeny ID, care needs to be taken to ensure that:
      //  (1) duplicate phylogeny IDs are not created within the same file, and
      //  (2) all current references to this phylogeny continue to make sense.

      // Check arguments.
      if (!has(payload, "phylogeny")) {
        throw new Error(
          'changePhylogenyId needs a phylogeny to modify using the "phylogeny" argument'
        );
      }

      if (!has(payload, "phylogenyId")) {
        throw new Error(
          'changePhylogenyId needs a new phylogeny ID using the "phylogenyId" argument'
        );
      }

      // What was the previous phylogeny ID?
      const oldPhylogenyId = context.rootGetters.getPhylogenyId(
        payload.phylogeny
      );

      // No need to do anything if they haven't changed.
      if (oldPhylogenyId === payload.phylogenyId) return;

      // Do any of our current phylogenies have this ID?
      const phylogenyWithDuplicateID =
        context.rootState.phyx.currentPhyx.phylogenies.find(
          (phylogeny) =>
            has(phylogeny, "@id") && phylogeny["@id"] === payload.phylogenyId
        );
      if (phylogenyWithDuplicateID) {
        throw new Error(
          `Attempt to change ${oldPhylogenyId} to ${payload.phylogenyId} failed: duplicate phylogeny ID detected.`
        );
      }

      // If any phyloreferences refer to oldPhylogenyId, replace it with
      // references to the new phylogenyId.
      context.rootState.phyx.currentPhyx.phylorefs.forEach((phyloref) => {
        if (has(phyloref.expectedResolution || {}, oldPhylogenyId)) {
          // Copy the expected resolution of oldPhylogenyId into the new phylogenyId.
          context.commit("setPhylorefProps", {
            phyloref,
            phylogenyId: payload.phylogenyId,
            expectedResolution: phyloref.expectedResolution[oldPhylogenyId],
          });
          // Delete the expected resolution of oldPhylogenyId.
          context.commit("setPhylorefProps", {
            phyloref,
            phylogenyId: oldPhylogenyId,
            expectedResolution: undefined,
          });
        }
      });

      // Change the phylogeny.
      context.commit("setPhylogenyProps", {
        phylogeny: payload.phylogeny,
        "@id": payload.phylogenyId,
      });
    },
  },
};
