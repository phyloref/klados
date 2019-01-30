<template>
  <div class="card border-dark">
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
            {{ phylogeny.label || `Phylogeny ${phylogenyIndex + 1}` }}
          </th>
        </thead>
        <tbody>
          <tr
            v-if="phylorefs.length === 0"
            class="bg-white"
          >
            <td :colspan="4 + phylogenies.length">
              <Center><em>No phyloreferences loaded</em></Center>
            </td>
          </tr>
          <tr v-for="(phyloref, phylorefIndex) of phylorefs">
            <td>&nbsp;</td>
            <td>
              <a
                href="javascript: void(0)"
                @click="$store.commit('changeDisplay', { phyloref })"
              >
                {{ phyloref.label || `Phyloref ${phylorefIndex + 1}` }}
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
    phyx: state => state.phyx,
    phylorefs: state => state.phyx.currentPhyx.phylorefs,
    phylogenies: state => state.phyx.currentPhyx.phylogenies,
  }),
  methods: {
    hasReasoningResults(phyloref) {
      if (!has(this.$store.state.phyx.reasoningResults, 'phylorefs')) return false;

      const phylorefURI = this.$store.getters.getBaseURIForPhyloref(phyloref);
      return has(this.$store.state.phyx.reasoningResults.phylorefs, phylorefURI);
    },
    getPhylorefExpectedNodeLabels(phyloref, phylogeny) {
      // Return a list of nodes that a phyloreference is expected to resolve to.
      return new PhylorefWrapper(phyloref).getExpectedNodeLabels(phylogeny);
    },
    getNodesById(phylogeny, nodeId) {
      // Return all node labels with this nodeId in this phylogeny.
      const parsed = new PhylogenyWrapper(phylogeny).getParsedNewickWithIRIs(
        this.$store.getters.getBaseURIForPhylogeny(phylogeny),
        d3.layout.newick_parser
      );

      function searchNode(node, results = []) {
        if(has(node, '@id') && node['@id'] === nodeId) {
          results.push(node);
        }
        if(has(node, 'children')) {
          node.children.forEach(child => searchNode(child, results));
        }
        return results;
      }

      if(!has(parsed, 'json')) return [];
      return searchNode(parsed.json);
    },
    getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) {
      // Converts node IDs to node labels, if present.
      const resolvedNodes = this.$store.getters.getResolvedNodesForPhylogeny(
        phylogeny, phyloref, false
      );

      return resolvedNodes
        .map(nodeId => this.getNodesById(phylogeny, nodeId))
        .reduce((a, b) => a.concat(b), [])
        .map(node => node.name || '(unlabelled)');
    },
  }
};
</script>
