<template>
  <div>
    <div class="card border-dark">
      <h5 class="card-header border-dark">
        Phyloreference collection
      </h5>
      <div class="card-body">
        <form>
          <!-- Phyx collection name (if we have more than one phyloref!) -->
          <div
            v-if="phylorefs.length > 1 || phyx.title"
            class="form-group row"
          >
            <label
              for="phyx-label"
              class="col-form-label col-md-2"
            >
              Collection name
            </label>
            <div class="col-md-10">
              <input
                id="phyx-label"
                v-model="phyx.title"
                type="text"
                class="form-control"
                placeholder="Enter title here"
              >
            </div>
          </div>

          <!-- Curated by information -->
          <div class="form-group row">
            <label
              for="curator-name"
              class="col-form-label col-md-2"
            >
              Curated by
            </label>
            <div class="col-md-4">
              <input
                id="curator-name"
                v-model="phyxCurator"
                type="text"
                class="form-control"
                placeholder="Curator name"
              >
            </div>
            <div class="col-md-3">
              <input
                id="curator-email"
                v-model="phyxCuratorEmail"
                type="email"
                class="form-control"
                placeholder="Curator e-mail address"
              >
            </div>
            <div class="col-md-3 input-group">
              <input
                id="external-reference"
                v-model="phyxCuratorORCID"
                class="form-control"
                placeholder="Curator ORCID"
              >
              <div class="input-group-append">
                <a
                  class="btn btn-outline-secondary"
                  target="_blank"
                  :href="'https://orcid.org/' + phyxCuratorORCID"
                >
                  Open in new window
                </a>
              </div>
            </div>
          </div>

          <!-- Default nomenclatural code -->
          <div class="form-group row">
            <label
              for="default-nomen-code"
              class="col-form-label col-md-2"
            >
              Default nomenclatural code
            </label>
            <div class="col-md-10">
              <select
                id="nomen-code"
                :value="$store.getters.getDefaultNomenCodeURI"
                class="form-control"
                @change="$store.commit('setDefaultNomenCodeURI', { defaultNomenclaturalCodeURI: $event.target.value })"
              >
                <option
                  v-for="(nomenCode, nomenCodeIndex) of nomenCodes"
                  :value="nomenCode.uri"
                >
                  {{ nomenCode.label }}
                </option>
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="card border-dark mt-2">
      <h5 class="card-header border-dark">
        Phyloreferences in this file
      </h5>
      <div class="card-body p-0">
        <table class="table table-hover table-flush">
          <thead>
            <th>&nbsp;</th>
            <th>Phyloreference</th>
            <th>Type</th>
            <th>Internal specifiers</th>
            <th>External specifiers</th>
            <th v-for="(phylogeny, phylogenyIndex) of phylogenies">
              {{ getPhylogenyLabel(phylogeny) }}
            </th>
          </thead>
          <tbody>
            <tr
              v-if="phylorefs.length === 0"
              class="bg-white"
            >
              <td :colspan="4 + phylogenies.length">
                <Center><em>No phyloreferences in this file</em></Center>
              </td>
            </tr>
            <tr v-for="(phyloref, phylorefIndex) of phylorefs">
              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="deletePhyloref(phyloref)"
                >
                  &#x2715;
                </button>
              </td>
              <td>
                <a
                  href="javascript: void(0)"
                  @click="$store.commit('changeDisplay', { phyloref })"
                >
                  {{ getPhylorefLabel(phyloref) }}
                </a>
              </td>
              <td>{{ $store.getters.getPhylorefType(phyloref) }}</td>
              <td>{{ (phyloref.internalSpecifiers || []).length }}</td>
              <td>{{ (phyloref.externalSpecifiers || []).length }}</td>
              <td v-for="(phylogeny, phylogenyIndex) of phylogenies">
                <template v-if="!getPhylorefExpectedNodeLabel(phyloref, phylogeny)">
                  <strong>No expected node</strong>
                  <template v-if="hasReasoningResults(phyloref)">
                    <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny).length === 0">
                      but <strong>did not resolve to any node</strong>
                    </template>
                    <template v-else-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny).length > 1">
                      but <strong>resolved to multiple nodes: {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) }}</strong>
                    </template>
                    <template v-else>
                      and resolved to {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0]||"an unlabeled node" }}
                    </template>
                  </template>
                </template>
                <template v-else>
                  Expected to resolve to node {{ getPhylorefExpectedNodeLabel(phyloref, phylogeny) }}
                  <template v-if="hasReasoningResults(phyloref)">
                    <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny).length === 0">
                      but <strong>did not resolve to any node</strong>
                    </template>
                    <template v-else-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny).length > 1">
                      but <strong>resolved to multiple nodes: {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) }}</strong>
                    </template>
                    <template v-else>
                      and resolved
                      <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0] === getPhylorefExpectedNodeLabel(phyloref, phylogeny)">
                        correctly
                      </template>
                      <template v-else>
                        <strong>incorrectly</strong>
                      </template>
                      to {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0]||"an unlabeled node" }}
                    </template>
                  </template>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer">
        <div
          class="btn-group"
          role="group"
          area-label="Phyx file management"
        >
          <button
            class="btn btn-primary"
            href="javascript:;"
            @click="$store.commit('createEmptyPhyloref')"
          >
            Add phyloreference
          </button>
        </div>
      </div>
    </div>

    <div class="card border-dark mt-2">
      <h5 class="card-header border-dark">
        Phylogenies in this file
      </h5>
      <div class="card-body p-0">
        <table class="table table-hover table-flush">
          <thead>
            <th>&nbsp;</th>
            <th>Phylogeny</th>
            <th>Description</th>
          </thead>
          <tbody>
            <tr
              v-if="phylogenies.length === 0"
              class="bg-white"
            >
              <td :colspan="3">
                <Center><em>No phylogenies in this file</em></Center>
              </td>
            </tr>
            <tr v-for="(phylogeny, phylogenyIndex) of phylogenies">
              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="deletePhylogeny(phylogeny)"
                >
                  &#x2715;
                </button>
              </td>
              <td>
                <a
                  href="javascript: void(0)"
                  @click="$store.commit('changeDisplay', { phylogeny })"
                >
                  {{ getPhylogenyLabel(phylogeny) }}
                </a>
              </td>
              <td>
                {{ phylogeny.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer">
        <div
          class="btn-group"
          role="group"
          area-label="Phylogeny management"
        >
          <button
            class="btn btn-primary"
            href="javascript:;"
            @click="$store.commit('createEmptyPhylogeny')"
          >
            Add phylogeny
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * Display a summary of the entire Phyx file.
 */
import { mapState } from 'vuex';
import { has } from 'lodash';
import { PhylorefWrapper, PhylogenyWrapper, TaxonNameWrapper } from '@phyloref/phyx';

export default {
  name: 'PhyxView',
  computed: {
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    phyxCurator: {
      get() { return this.phyx.curator; },
      set(name) { this.$store.commit('setCurator', { name }); },
    },
    phyxCuratorEmail: {
      get() { return this.phyx.curatorEmail; },
      set(email) { this.$store.commit('setCurator', { email }); },
    },
    phyxCuratorORCID: {
      get() { return this.phyx.curatorORCID; },
      set(orcid) { this.$store.commit('setCurator', { orcid }); },
    },
    ...mapState({
      phyx: state => state.phyx.currentPhyx,
      phylorefs: state => state.phyx.currentPhyx.phylorefs,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
    }),
  },
  methods: {
    getPhylogenyLabel(phylogeny) {
      return new PhylogenyWrapper(phylogeny).label
        || `Phylogeny ${this.phylogenies.indexOf(phylogeny) + 1}`;
    },
    getPhylorefLabel(phyloref) {
      return new PhylorefWrapper(phyloref).label
        || `Phyloref ${this.phylorefs.indexOf(phyloref) + 1}`;
    },
    hasReasoningResults(phyloref) {
      if (!has(this.$store.state.resolution.reasoningResults, 'phylorefs')) return false;

      const phylorefURI = this.$store.getters.getPhylorefId(phyloref);
      return has(this.$store.state.resolution.reasoningResults.phylorefs, phylorefURI);
    },
    getPhylorefExpectedNodeLabel(phyloref, phylogeny) {
      // Return a list of nodes that a phyloreference is expected to resolve to.
      return this.$store.getters.getExpectedNodeLabel(
        phyloref,
        phylogeny,
      );
    },
    getNodesById(phylogeny, nodeId) {
      // Return all node labels with this nodeId in this phylogeny.
      const parsed = new PhylogenyWrapper(phylogeny).getParsedNewickWithIRIs(
        this.$store.getters.getPhylogenyId(phylogeny),
        d3.layout.newick_parser,
      );

      function searchNode(node, results = []) {
        if (has(node, '@id') && node['@id'] === nodeId) {
          results.push(node);
        }
        if (has(node, 'children')) {
          node.children.forEach(child => searchNode(child, results));
        }
        return results;
      }

      if (!has(parsed, 'json')) return [];
      return searchNode(parsed.json);
    },
    getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) {
      // Converts node IDs to node labels, if present.
      const resolvedNodes = this.$store.getters.getResolvedNodesForPhylogeny(
        phylogeny, phyloref, false,
      );

      return resolvedNodes
        .map(nodeId => this.getNodesById(phylogeny, nodeId))
        .reduce((a, b) => a.concat(b), [])
        .map(node => node.name || '(unlabelled)');
    },
    deletePhyloref(phyloref) {
      const warningString = `Are you sure you wish to delete phyloreference '${
        this.getPhylorefLabel(phyloref)
      }'?`;
      if (confirm(warningString)) {
        this.$store.commit('deletePhyloref', { phyloref });
      }
    },
    deletePhylogeny(phylogeny) {
      const warningString = `Are you sure you wish to delete phylogeny '${
        this.getPhylogenyLabel(phylogeny)
      }'?`;
      if (confirm(warningString)) {
        this.$store.commit('deletePhylogeny', { phylogeny });
      }
    },
  },
};
</script>
