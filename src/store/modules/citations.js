/*
 * Store module for handing citations.
 *
 * Note that citations are located as keys on objects (for example, a phyloreference
 * can have both a primaryPhylogenyCitation as well as a phylogenyCitation). Thus,
 * citations are referred to by an object (which exists elsewhere in the Vuex store)
 * and the key for the citation.
 *
 * The format for citations we use is based on BibJSON (http://okfnlabs.org/bibjson/),
 * since that is essentially what Regnum uses. This is surprisingly poorly supported,
 * except for the Citation.JS library (https://citation.js.org/), but I haven't been
 * able to get it working on Vue JS yet. Therefore, mostly, I've implemented a
 * basic CitationWrapper here, we'll replace it with Citations.JS or another proper
 * library when we can.
 */

import Vue from 'vue';
import { has } from 'lodash';

class CitationWrapper {
  constructor(citation) {
    // Store the citation we're wrapping.
    this.citation = citation;
  }

  toString() {
    return JSON.stringify(this.citation);
  }

  get identifiers() {
    // Returns a list of identifiers for this citation.
    const citation = this.citation;

    if (has(citation, 'identifier')) {
      // Are there more than one identifier?
      if (Array.isArray(citation.identifier)) {
        return citation.identifier;
      }

      // If not, make an array out of that one identifier.
      return [citation.identifier];
    }

    // No identifiers!
    return [];
  }

  get dois() {
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'doi' && has(identifier, 'id')) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
  }

  get firstDOI() {
    const dois = this.dois || [];
    if (dois.length > 0) return dois[0];
    return undefined;
  }
}

export default {
  getters: {
    getWrappedCitation: () => citation => new CitationWrapper(citation),
  },
  mutations: {
    setCitations(state, payload) {
      Vue.set(
        payload.object,
        payload.citationKey,
        payload.citations,
      );
    },
  },
};
