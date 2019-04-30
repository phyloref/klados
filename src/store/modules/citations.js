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
    if (!this.citation || isEmpty(this.citation)) return undefined;

    // Returns a string representation of this citation.
    // TODO add editors
    let authors = this.authorsAsStrings;
    if (authors.length === 0) authors = ['Anonymous'];
    if (authors.length > 2) authors = [`${authors[0]} et al`];
    let authorsAndTitle = `${authors.join(' and ')} (${this.citation.year || 'n.d.'}) ${this.citation.title || 'Untitled'}`;
    if (has(this.citation, 'section_title')) {
      authorsAndTitle += ` (section: ${this.citation.section_title})`;
    }

    let additionalInfo = ' ';
    if (has(this.citation, 'figure')) additionalInfo += ` fig ${this.citation.figure}`;

    // Add DOIs and URLs.
    additionalInfo += this.dois.map(doi => ` doi: ${doi}`).join('');
    additionalInfo += this.urls.map(url => ` URL: ${url}`).join('');

    additionalInfo += this.isbns.map(isbn => ` ISBN: ${isbn}`).join('');

    if (has(this.citation, 'journal')) {
      const journal = this.citation.journal;
      const journalIssue = (has(journal, 'number')) ? `(${journal.number})` : '';
      const journalPages = (has(journal, 'pages')) ? `:${journal.pages}` : '';
      additionalInfo += this.issns.map(issn => `ISSN: ${issn} `).join('');
      return `${authorsAndTitle} ${journal.name || 'Unknown journal'} ${journal.volume || 'Unknown volume'}${journalIssue}${journalPages}${additionalInfo}`;
    }

    // Must be a book or book section.
    return `${authorsAndTitle} ${this.citation.publisher}, ${this.citation.city}${additionalInfo}`;
  }

  get authors() {
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
    Vue.set(this.citation, 'authors', authors);
  }

  get authorsAsStrings() {
    return this.authors.map(author => author.name);
  }

  set authorsAsStrings(authorsAsStrings) {
    // TODO parse names back into first and last name.
    Vue.set(this.citation, 'authors', authorsAsStrings.map(name => ({ name })));
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
    this.citation.identifier = identifiers;
  }

  get dois() {
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'doi' && has(identifier, 'id') && !isEmpty(identifier.id)) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
  }

  get isbns() {
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'isbn' && has(identifier, 'id') && !isEmpty(identifier.id)) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
  }

  set isbns(isbns) {
    this.identifiers = this.identifiers
      .filter(identifier => has(identifier, 'type') && identifier.type !== 'isbn')
      .concat(isbns.map(isbn => ({ type: 'isbn', id: isbn })));
  }

  get issns() {
    return this.identifiers.map((identifier) => {
      if (has(identifier, 'type') && identifier.type === 'issn' && has(identifier, 'id') && !isEmpty(identifier.id)) {
        return [identifier.id];
      }

      return [];
    }).reduce((acc, val) => acc.concat(val), []);
  }

  set issns(issns) {
    this.identifiers = this.identifiers
      .filter(identifier => has(identifier, 'type') && identifier.type !== 'issn')
      .concat(issns.map(issn => ({ type: 'issn', id: issn })));
  }

  get firstDOI() {
    const dois = this.dois || [];
    if (dois.length > 0) return dois[0];
    return undefined;
  }

  get firstURL() {
    if (this.urls.length > 0) return this.urls[0];

    // If we don't have a URL, look for a DOI.
    if (this.firstDOI) return `http://doi.org/${encodeURI(this.firstDOI)}`;

    // TODO: Look for ISBN.
    // TODO: If all else fails, try https://search.crossref.org/?q={title}

    return undefined;
  }

  get journal() {
    if (has(this.citation, 'journal')) return this.citation.journal;
    Vue.set(this.citation, 'journal', {});
    return this.citation.journal;
  }

  get urls() {
    if (has(this.citation, 'link')) {
      return this.citation.link
        .filter(link => has(link, 'url'))
        .map(link => link.url);
    }
    return [];
  }

  set urls(urls) {
    Vue.set(this.citation, 'link', urls.map(url => ({ url })));
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
