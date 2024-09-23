// URL for submitting jobs to JPhyloRef for processing.
export const JPHYLOREF_SUBMISSION_URL = 'https://reasoner.phyloref.org/reason';

// X-Hub-Signature secret used to communicate with JPhyloRef.
export const JPHYLOREF_X_HUB_SIGNATURE_SECRET = 'undefined';

/* Open Tree of Life API endpoints used by Klados */
// URL to retrieve information about the Open Tree of Life
// (https://github.com/OpenTreeOfLife/germinator/wiki/Synthetic-tree-API-v3#about_tree)
export const OPEN_TREE_ABOUT_URL = 'https://api.opentreeoflife.org/v3/tree_of_life/about';

// URL to retrieve Open Tree of Life Taxonomy IDs corresponding the given taxon names
// (https://github.com/OpenTreeOfLife/germinator/wiki/TNRS-API-v3#match_names)
export const OPEN_TREE_TNRS_MATCH_NAMES_URL = 'https://api.opentreeoflife.org/v3/tnrs/match_names';

// URL to retrieve the Open Tree of Life synthetic tree induced subtree containing particular
// Open Tree Taxonomy IDs
// (https://github.com/OpenTreeOfLife/germinator/wiki/Synthetic-tree-API-v3#induced_subtree)
export const OPEN_TREE_INDUCED_SUBTREE_URL = 'https://api.opentreeoflife.org/v3/tree_of_life/induced_subtree';

// The default cookie expiry setting (see https://www.npmjs.com/package/vue-cookies for formats)
export const COOKIE_EXPIRY = '30d'; // Expire cookies in 30 days

// Cookie names to use for:
// - the 'allowed' cookie -- if set to 'true', this means that the user has granted us permission
//   to store their information in cookies.
export const COOKIE_ALLOWED = 'kladosCookieAllowed';
// - the default nomenclatural code
export const COOKIE_DEFAULT_NOMEN_CODE_IRI =  'kladosDefaultNomenclaturalCodeIRI';
// - curator name
export const COOKIE_CURATOR_NAME = 'kladosCuratorName';
// - curator e-mail address
export const COOKIE_CURATOR_EMAIL = 'kladosCuratorEmail';
// - curator ORCID
export const COOKIE_CURATOR_ORCID = 'kladosCuratorORCID';
