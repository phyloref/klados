<template>
  <!--
    Display a summary of the entire PHYX file.
  -->
  <div class="card">
    <h5 class="card-header">Phyloreferences in this file</h5>
      <table class="table table-hover table-flush mb-0">
        <thead>
          <th>&nbsp;</th>
          <th>Phyloreference</th>
          <th>Internal specifiers</th>
          <th>External specifiers</th>
          <th v-for="(phylogeny, phylogenyIndex) of phylogenies">
            {{ getPhylogenyLabel(phylogeny) }}
          </th>
        </thead>
        <tbody>
          <tr v-if="phylorefs.length === 0" class="bg-white">
            <td :colspan="4 + phylogenies.length">
              <Center><em>No phyloreferences loaded</em></Center>
            </td>
          </tr>
          <tr v-for="(phyloref, phylorefIndex) of phylorefs">
            <td>&nbsp;</td>
            <td>
              <a
                href="javascript: void(0)"
                @click="resetSVG(); selectedPhyloref = phyloref"
              >
                {{ getPhylorefLabel(phyloref) }}
              </a>
            </td>
            <td>{{ phyloref.internalSpecifiers.length }}</td>
            <td>{{ phyloref.externalSpecifiers.length }}</td>
            <td v-for="(phylogeny, phylogenyIndex) of phylogenies">
              <template v-if="getPhylorefExpectedNodeLabels(phylogeny, phyloref).length === 0">
                <strong>Not matched</strong>
                <template v-if="hasProperty(reasoningResults, 'phylorefs')">
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
                <template v-if="hasProperty(reasoningResults, 'phylorefs')">
                  and
                  <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) > 1">
                    <strong>resolved to multiple nodes: {{ getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) }}</strong>
                  </template>
                  <template v-else>
                    resolved
                    <template v-if="getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)[0] === getPhylorefExpectedNodeLabels(phylogeny, phyloref)[0]">
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
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'PHYXView',
  computed: mapState({
    phyx: state => state.phyx,
    phylorefs: state => state.phyx.currentPhyx.phylorefs,
    phylogenies: state => state.phyx.currentPhyx.phylogenies,
    selectedPhyloref: state => state.selectedPhyloref,
    selectedSpecifier: state => state.selectedPhyloref.internalSpecifier,
    selectedTUnit: state => state.selectedPhyloref.internalSpecifier,
    selectedPhylogeny: state => state.selectedPhyloref.selectedPhylogeny,
  }),
};
</script>
