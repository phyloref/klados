<template>
  <div>
    <div class="card border-dark">
      <h5 class="card-header border-dark">
        Phyloreference collection
      </h5>
      <div class="card-body">
        <form>
          <!-- Phyx collection name (if we have more than one phyloref!) -->
          <div class="form-group row" v-if="phylorefs.length > 1 || phyx.title">
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
            <div class="col-md-5">
              <input
                id="curator-name"
                v-model="phyx.curator"
                type="text"
                class="form-control"
                placeholder="Curator name"
              >
            </div>
            <div class="col-md-5">
              <input
                id="curator-email"
                v-model="phyx.curatorEmail"
                type="email"
                class="form-control"
                placeholder="Curator e-mail address"
              >
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
                @change="$store.commit('setDefaultNomenCodeURI', { defaultNomenclaturalCodeURI: $event.target.value })"
                class="form-control"
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
            <th>Internal specifiers</th>
            <th>External specifiers</th>
            <th v-for="(phylogeny, phylogenyIndex) of phylogenies">
              {{ $store.getters.getPhylogenyLabel(phylogeny) }}
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
                >&#x2715;</button>
              </td>
              <td>
                <a
                  href="javascript: void(0)"
                  @click="$store.commit('changeDisplay', { phyloref })"
                >
                  {{ $store.getters.getPhylorefLabel(phyloref) }}
                </a>
              </td>
              <td>{{ (phyloref.internalSpecifiers || []).length }}</td>
              <td>{{ (phyloref.externalSpecifiers || []).length }}</td>
              <td v-for="(phylogeny, phylogenyIndex) of phylogenies">
                <template v-if="getPhylorefExpectedNodeLabels(phyloref, phylogeny).length === 0">
                  <strong>Not matched</strong>
                  <template v-if="hasReasoningResults(phyloref)">
                    but
                    <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) > 1">
                      <strong>resolved to multiple nodes: {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) }}</strong>
                    </template>
                    <template v-else>
                      resolved to {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0]||"(none)" }}
                    </template>
                  </template>
                </template>
                <template v-else>
                  Matched
                  <template v-if="hasReasoningResults(phyloref)">
                    and
                    <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) > 1">
                      <strong>resolved to multiple nodes: {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) }}</strong>
                    </template>
                    <template v-else>
                      resolved
                      <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0] === getPhylorefExpectedNodeLabels(phyloref, phylogeny)[0]">
                        correctly
                      </template>
                      <template v-else>
                        <strong>incorrectly</strong>
                      </template>
                      to {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0]||"(none)" }}
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
          <button
            class="btn btn-outline-primary"
            href="javascript:;"
            @click="reasonOverPhyloreferences()"
          >
            Reason over phyloreferences
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
                >&#x2715;</button>
              </td>
              <td>
                <a
                  href="javascript: void(0)"
                  @click="$store.commit('changeDisplay', { phylogeny })"
                >
                  {{ $store.getters.getPhylogenyLabel(phylogeny) }}
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
import { PhylorefWrapper, PhylogenyWrapper } from '@phyloref/phyx';

export default {
  name: 'PhyxView',
  computed: mapState({
    phyx: state => state.phyx.currentPhyx,
    phylorefs: state => state.phyx.currentPhyx.phylorefs,
    phylogenies: state => state.phyx.currentPhyx.phylogenies,
  }),
  methods: {
    hasReasoningResults(phyloref) {
      if (!has(this.$store.state.resolution.reasoningResults, 'phylorefs')) return false;

      const phylorefURI = this.$store.getters.getBaseURIForPhyloref(phyloref);
      return has(this.$store.state.resolution.reasoningResults.phylorefs, phylorefURI);
    },
    getPhylorefExpectedNodeLabels(phyloref, phylogeny) {
      // Return a list of nodes that a phyloreference is expected to resolve to.
      return new PhylorefWrapper(phyloref).getExpectedNodeLabels(phylogeny);
    },
    getNodesById(phylogeny, nodeId) {
      // Return all node labels with this nodeId in this phylogeny.
      const parsed = new PhylogenyWrapper(phylogeny).getParsedNewickWithIRIs(
        this.$store.getters.getBaseURIForPhylogeny(phylogeny),
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
    reasonOverPhyloreferences() {
      // Reason over all the phyloreferences and store the results on
      // the Vue model at vm.reasoningResults so we can access them.

      // Are we already reasoning? If so, ignore.
      if (this.reasoningInProgress) return;

      // Disable "Reason" buttons so they can't be reused.
      this.reasoningInProgress = true;
      $.post('http://localhost:34214/reason', {
        // This will convert the JSON-LD file into an application/x-www-form-urlencoded
        // string (see https://api.jquery.com/jquery.ajax/#jQuery-ajax-settings under
        // processData for details). The POST data sent to the server will look like:
        //  jsonld=%7B%5B%7B%22title%22%3A...
        // which translates to:
        //  jsonld={[{"title":...
        jsonld: JSON.stringify([new PhyxWrapper(
          this.$store.state.phyx.currentPhyx,
          d3.layout.newick_parser,
        )
          .asJSONLD()], undefined, 4),
      }).done((data) => {
        this.$store.commit('setReasoningResults', data);
        // console.log('Data retrieved: ', data);
      }).fail((jqXHR, textStatus, errorThrown) => {
        // We can try using the third argument, but it appears to be the
        // HTTP status (e.g. 'Internal Server Error'). So we default to that,
        // but look for a better one in the JSON response from the server, if
        // available.
        let error = errorThrown;
        if (has(jqXHR, 'responseJSON') && has(jqXHR.responseJSON, 'error')) {
          error = jqXHR.responseJSON.error;
        }

        if (error === undefined || error === '') error = 'unknown error';
        alert(`Error occurred on server while reasoning: ${error}`);
      }).always(() => {
        // Reset "Reasoning" buttons to their usual state.
        this.reasoningInProgress = false;
      });
    },
    deletePhyloref(phyloref) {
      const warningString = `Are you sure you wish to delete phyloreference '${
        this.$store.getters.getPhylorefLabel(phyloref)
      }'?`;
      if(confirm(warningString)) {
        this.$store.commit('deletePhyloref', { phyloref });
      }
    },
    deletePhylogeny(phylogeny) {
      const warningString = `Are you sure you wish to delete phylogeny '${
        this.$store.getters.getPhylogenyLabel(phylogeny)
      }'?`;
      if(confirm(warningString)) {
        this.$store.commit('deletePhylogeny', { phylogeny });
      }
    }
  },
};
</script>
