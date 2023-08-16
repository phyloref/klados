/*
 * Store module for handling citations.
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
 * basic CitationModel here, we'll replace it with Citations.JS or another proper
 * library when we can. We might switch over to CSL-JSON eventually (see issue
 * https://github.com/phyloref/clade-ontology/issues/69).
 */

import Vue from 'vue';
import { has, isEmpty, isString } from 'lodash';
import { CitationWrapper } from '@phyloref/phyx';

function isNonEmptyString(str) {
  // Helper method: checks to see if a provided object (1) is a string, that
  // (2) is non-empty after trimming.
  if (!isString(str)) return false;
  if (str.trim().length === 0) return false;
  return true;
}

class CitationModel {
  // Wraps a Citation in a Phyx document. Should be moved to phyx.js.

  constructor(citation) {
    // Store the citation we're wrapping.
    this.citation = citation;
    this.wrappedCitation = new CitationWrapper(citation);
  }

  toString() {
    // Return this citation in a string representation.
    return this.wrappedCitation.toString();
  }

  get authors() {
    // Return a list of authors (as author objects) for this citation.
    const citation = this.citation;

    if (has(citation, 'authors')) {
      // Is there more than one author?
      if (Array.isArray(citation.authors)) {
        return citation.authors;
      }

      // If not, make an array out of that one author.
      return [citation.authors];
    }

    return [];
  }

  set authors(authors) {
    // Set the list of authors (as author objects).
    Vue.set(this.citation, 'authors', authors);
  }

  get authorsAsStrings() {
    // Return a list of author names.
    return this.authors.map(agent => CitationWrapper.getAgentName(agent));
  }

  set authorsAsStrings(authorsAsStrings) {
    // Set a list of author names.
    // TODO parse names back into first and last name (https://github.com/phyloref/curation-tool/issues/145)
    Vue.set(this.citation, 'authors', authorsAsStrings.filter(isNonEmptyString).map(name => ({ name })));
  }

  get editorsAsStrings() {
    // Return a list of editor names.
    if (!has(this.citation, 'editors')) return [];
    return this.citation.editors.map(editor => CitationWrapper.getAgentName(editor));
  }

  set editorsAsStrings(editors) {
    // Set a list of editor names.
    // TODO parse names back into first and last name (https://github.com/phyloref/curation-tool/issues/145)
    Vue.set(this.citation, 'editors', editors.filter(isNonEmptyString).map(name => ({ name })));
  }

  get seriesEditorsAsStrings() {
    // Return a list of series editor names.
    if (!has(this.citation, 'series_editors')) return [];
    return this.citation.series_editors.map(editor => CitationWrapper.getAgentName(editor));
  }

  set seriesEditorsAsStrings(editors) {
    // Set a list of series editor names.
    // TODO parse names back into first and last name (https://github.com/phyloref/curation-tool/issues/145)
    Vue.set(this.citation, 'series_editors', editors.filter(isNonEmptyString).map(name => ({ name })));
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

  set identifiers(identifiers) {
    // Set the list of identifiers for this citation.
    Vue.set(this.citation, 'identifier', identifiers);
  }

  get doisAsStrings() {
    // Return a list of DOIs for this citation.
    return this.identifiers
      .filter(id => has(id, 'type') && id.type === 'doi' && has(id, 'id') && !isEmpty(id.id))
      .map(id => id.id);
  }

  set doisAsStrings(dois) {
    this.identifiers = this.identifiers
      // Remove all current DOIs while leaving other identifiers untouched.
      .filter(id => has(id, 'type') && id.type !== 'doi')
      // Replace them with the provided DOIs.
      .concat(dois.filter(isNonEmptyString).map(doi => ({ type: 'doi', id: doi })));
  }

  get isbns() {
    // Return a list of ISBNs for this citation.
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'isbn' && has(identifier, 'id') && !isEmpty(identifier.id)) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
  }

  set isbns(isbns) {
    // Set a list of ISBNs for this citation.
    this.identifiers = this.identifiers
      .filter(identifier => has(identifier, 'type') && identifier.type !== 'isbn')
      .concat(isbns.filter(isNonEmptyString).map(isbn => ({ type: 'isbn', id: isbn })));
  }

  get issns() {
    // Return a list of ISSNs for this citation.
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'issn' && has(identifier, 'id') && !isEmpty(identifier.id)) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
  }

  set issns(issns) {
    // Set a list of ISSNs for this citation.
    this.identifiers = this.identifiers
      .filter(identifier => has(identifier, 'type') && identifier.type !== 'issn')
      .concat(issns.filter(isNonEmptyString).map(issn => ({ type: 'issn', id: issn })));
  }

  get firstDOI() {
    // Return the first DOI of this citation (used to provide a URL to access it).
    const dois = this.doisAsStrings || [];
    if (dois.length > 0) return dois[0];
    return undefined;
  }

  get urlsAsStrings() {
    // Return a list of URLs in this citation.
    if (has(this.citation, 'link')) return this.citation.link.map(link => link.url);
    return [];
  }

  set urlsAsStrings(urls) {
    // Set the list of URLs in this citation.
    Vue.set(this.citation, 'link', urls.filter(isNonEmptyString).map(url => ({ url })));
  }

  get firstURL() {
    // Return the first URL in the list of citations (used to provide a URL for buttons).
    if (this.urlsAsStrings.length > 0) return this.urlsAsStrings[0];
    return undefined;
  }

  get url() {
    // Get a URL for this citation, whether from the list of URLs or the list of DOIs.
    if (this.firstURL) return this.firstURL;

    // If we don't have a URL, look for a DOI.
    if (this.firstDOI) return `http://doi.org/${encodeURI(this.firstDOI)}`;

    // If we don't have a DOI, look for an ISBN or ISSN.
    if (this.isbns.length > 0) return `https://www.worldcat.org/search?q=bn%3A${encodeURI(this.isbns[0])}`;
    if (this.issns.length > 0) return `https://www.worldcat.org/search?q=n2%3A${encodeURI(this.issns[0])}`;

    // If all else fails, try title searches.
    if (has(this.citation, 'type') && has(this.citation, 'title')) {
      // We should check articles against CrossRef.
      if (this.citation.type === 'article') return `https://search.crossref.org/?q=${encodeURI(this.citation.title)}`;

      // We should search book and book sections against WorldCat.
      return `https://www.worldcat.org/search?q=${encodeURI(this.citation.title)}`;
    }

    return undefined;
  }

  get journal() {
    // Return the journal of this citation. If one doesn't exist, create it and
    // return it.
    if (has(this.citation, 'journal')) return this.citation.journal;
    Vue.set(this.citation, 'journal', {});
    return this.citation.journal;
  }
}

export default {
  getters: {
    // Get a wrapped citation for a given citation.
    getCitationModel: () => citation => new CitationModel(citation),
  },
  mutations: {
    // Update the value of a citation, using object-citationKey so we can change
    // it anywhere in the Vuex state.
    setCitations(state, payload) {
      Vue.set(
        payload.object,
        payload.citationKey,
        payload.citations,
      );
    },
  },
};
