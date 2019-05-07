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
 * library when we can. We might switch over to CSL-JSON eventually (see issue
 * https://github.com/phyloref/clade-ontology/issues/69).
 */

import Vue from 'vue';
import { has, isEmpty } from 'lodash';

class CitationWrapper {
  // Wraps a Citation in a Phyx document. Should be moved to phyx.js.

  constructor(citation) {
    // Store the citation we're wrapping.
    this.citation = citation;
  }

  toString() {
    // Return this citation in a string representation.
    if (!this.citation || isEmpty(this.citation)) return undefined;

    // TODO add editors
    let authors = this.authorsAsStrings;
    if (authors.length === 0) authors = ['Anonymous'];
    if (authors.length > 2) authors = [`${authors[0]} et al`];
    let authorsAndTitle = `${authors.join(' and ')} (${this.citation.year || 'n.d.'}) ${this.citation.title || 'Untitled'}`;
    if (has(this.citation, 'section_title')) {
      authorsAndTitle += ` (section: ${this.citation.section_title})`;
    }

    // Additional info stores details that should be at the end of the figure number,
    // DOIs, URLs, ISBNs and so on.
    let additionalInfo = ' ';
    if (has(this.citation, 'figure')) additionalInfo += ` fig ${this.citation.figure}`;

    // Add DOIs and URLs.
    additionalInfo += this.dois.map(doi => ` doi: ${doi}`).join('');
    additionalInfo += this.urlsAsStrings.map(url => ` URL: ${url}`).join('');

    additionalInfo += this.isbns.map(isbn => ` ISBN: ${isbn}`).join('');

    // A citation for a journal article should be different from others.
    if (has(this.citation, 'journal') && this.citation.type === 'article') {
      const journal = this.citation.journal;
      const journalIssue = (has(journal, 'number')) ? `(${journal.number})` : '';
      const pages = (has(this.citation, 'pages')) ? `:${this.citation.pages}` : '';
      additionalInfo += this.issns.map(issn => `ISSN: ${issn} `).join('');
      return `${authorsAndTitle} ${journal.name || 'Unknown journal'} ${journal.volume || 'Unknown volume'}${journalIssue}${pages}${additionalInfo}`;
    }

    // If we are here, this must be a book or a book_section.
    if (has(this.citation, 'pages')) additionalInfo += ` pages: ${this.citation.pages}`;

    if (has(this.citation, 'publisher') && has(this.citation, 'city')) {
      return `${authorsAndTitle} ${this.citation.publisher}, ${this.citation.city}${additionalInfo}`;
    }

    if (has(this.citation, 'publisher')) {
      return `${authorsAndTitle} ${this.citation.publisher}${additionalInfo}`;
    }

    return `${authorsAndTitle}${additionalInfo}`;
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
    return this.authors.map(author => author.name);
  }

  set authorsAsStrings(authorsAsStrings) {
    // Set a list of author names.
    // TODO parse names back into first and last name.
    Vue.set(this.citation, 'authors', authorsAsStrings.map(name => ({ name })));
  }

  get editorsAsStrings() {
    // Return a list of editor names.
    if (!has(this.citation, 'editors')) return [];
    return this.citation.editors.map(editor => editor.name);
  }

  set editorsAsStrings(editors) {
    // Set a list of editor names.
    // TODO parse names back into first and last name.
    Vue.set(this.citation, 'editors', editors.map(name => ({ name })));
  }

  get seriesEditorsAsStrings() {
    // Return a list of series editor names.
    if (!has(this.citation, 'series_editors')) return [];
    return this.citation.series_editors.map(editor => editor.name);
  }

  set seriesEditorsAsStrings(editors) {
    // Set a list of series editor names.
    // TODO parse names back into first and last name.
    Vue.set(this.citation, 'series_editors', editors.map(name => ({ name })));
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
    this.citation.identifier = identifiers;
  }

  get dois() {
    // Return a list of DOIs for this citation.
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'doi' && has(identifier, 'id') && !isEmpty(identifier.id)) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
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
      .concat(isbns.map(isbn => ({ type: 'isbn', id: isbn })));
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
      .concat(issns.map(issn => ({ type: 'issn', id: issn })));
  }

  get firstDOI() {
    // Return the first DOI of this citation (used to provide a URL to access it).
    const dois = this.dois || [];
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
    this.citation.link = urls.map(url => ({ url }));
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
    getWrappedCitation: () => citation => new CitationWrapper(citation),
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
