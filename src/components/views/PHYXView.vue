<template>
  <!--
  Neither a phyloreference nor a phylogeny has been selected, so
  display a summary of the entire PHYX file instead.
-->
  <div class="panel">
    <div class="panel-body">
      <table class="table table-hover table-bordered">
        <thead>
          <th>&nbsp;</th>
          <th>Phyloreference</th>
          <th>Internal specifiers</th>
          <th>External specifiers</th>
          <th v-for="(phylogeny, phylogenyIndex) of testcase.phylogenies">
            {{ getPhylogenyLabel(phylogeny) }}
          </th>
        </thead>
        <tbody>
          <tr v-if="testcase.phylorefs.length === 0">
            <td :colspan="4 + testcase.phylogenies.length">
              <Center><em>No phyloreferences loaded</em></Center>
            </td>
          </tr>
          <tr v-for="(phyloref, phylorefIndex) of testcase.phylorefs">
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
            <td v-for="(phylogeny, phylogenyIndex) of testcase.phylogenies">
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
  </div>
</template>

<script>
export default {
  name: 'PHYXView',
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
