<template>
  <div>
    <!-- Add a warning if this phyloreference has changed -->
    <ModifiedCard
      message="This phyloreference has been modified since being loaded! Use 'Save as JSON' to save your changes."
      :compare="selectedPhyloref"
      :compareTo="currentPhyx.phylorefs[currentPhyx.phylorefs.indexOf(selectedPhyloref)]"
    />

    <!-- Phyloreference information -->
    <div class="card" v-if="!display.phylogeny">
      <h5 class="card-header">
        Phyloreference information
      </h5>

      <div class="card-body">
        <form>
          <!-- Phyloreference label -->
          <div class="form-group row">
            <label
              for="label"
              class="col-form-label col-md-2"
            >
              Label
            </label>
            <div class="col-md-10">
              <input
                id="label"
                v-model="selectedPhylorefLabel"
                type="text"
                class="form-control"
                placeholder="Phyloreference label"
              >
            </div>
          </div>

          <!-- Phyloreference clade definition -->
          <div class="form-group row">
            <label
              for="definition"
              class="col-form-label col-md-2"
            >
              Clade definition
            </label>
            <div class="col-md-10">
              <textarea
                id="definition"
                v-model.lazy="selectedCladeDefinition"
                class="form-control"
                rows="6"
                placeholder="Phylogenetic clade definition"
              />
            </div>
          </div>

          <!-- Phyloreference curator comments -->
          <div class="form-group row">
            <label
              for="curator-comments"
              class="col-form-label col-md-2"
            >
              Curator comments
            </label>
            <div class="col-md-10">
              <textarea
                id="curator-comments"
                v-model.lazy="selectedCuratorComments"
                class="form-control"
                rows="2"
                placeholder="Curator notes relating to this phyloreference"
              />
            </div>
          </div>
        </form>
      </div>
    </div>

    <!--
      Panel with information on expected and actual resolution
      We should:
        - display all phylogenies when looking up a phyloreference or specifiers
        - display only the selected phylogeny when it's selected
    -->
    <template v-for="(phylogeny, phylogenyIndex) of currentPhyx.phylogenies">
      <template v-if="selectedPhylogeny === undefined || selectedPhylogeny === phylogeny">
        <div class="card mt-2">
          <h5 class="card-header">
            Expected and actual resolution <span v-if="display.phylogeny">of {{phyloref.label || 'unlabeled phyloreference'}}</span> on {{phylogeny.label || `Phylogeny ${phylogenyIndex + 1}`}}
          </h5>
          <div class="card-body">
            <!-- Node(s) this phyloreference is expected to resolve to -->
            <label
              for="curator-comments"
              class="control-label col-md-2"
            >
              Expected nodes
            </label>
            <div class="input-group col-md-10">
              <div class="input-group">
                <!-- Display the phylogeny where this node is expected to match -->
                <span class="input-group-btn">
                  <a
                    class="btn btn-default"
                    :href="'#current_expected_label_phylogeny' + phylogenyIndex"
                    title="Click here to jump to the expected label"
                    type="button"
                  >
                    Go to node
                  </a>
                </span>

                <!-- Display the matching node(s)
                <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length === 0">
                  <!-- We matched no nodes
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    value="No nodes could be matched"
                  >
                </template>

                <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length === 1">
                  <!-- We matched exactly one node
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref)[0]"
                  >
                </template>

                <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length > 1">
                  <!-- We matched more than one node
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length + ' nodes matched: ' + getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).join(', ')"
                  >
                </template>

                <!-- Display a dropdown menu that allows the modified label to be changed.
                <div class="input-group-btn">
                  <button
                    type="button"
                    class="btn btn-primary dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Change <span class="caret" />
                  </button>
                  <ul class="dropdown-menu dropdown-menu-right">
                    <!-- List every labeled node in this phylogeny.
                    <li class="dropdown-header">
                      Labeled internal nodes in this phylogeny
                    </li>
                    <li
                      v-for="nodeLabel of getNodeLabelsInPhylogeny(phylogeny, 'internal').sort()"
                      :class="{active: getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).includes(nodeLabel)}"
                    >
                      <a
                        href="#selected-phyloref"
                        @click="togglePhylorefExpectedNodeLabel(phylogeny, selectedPhyloref, nodeLabel)"
                      >
                        {{ nodeLabel }}
                      </a>
                    </li>
                    <li class="dropdown-header">
                      Labeled terminal nodes in this phylogeny
                    </li>
                    <li
                      v-for="nodeLabel of getNodeLabelsInPhylogeny(phylogeny, 'terminal').sort()"
                      :class="{active: getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).includes(nodeLabel)}"
                    >
                      <a
                        href="#selected-phyloref"
                        @click="togglePhylorefExpectedNodeLabel(phylogeny, selectedPhyloref, nodeLabel)"
                      >
                        {{ nodeLabel }}
                      </a>
                    </li>
                  </ul>
                </div> -->
              </div>
            </div>

            <!-- Node(s) this phyloreference actually resolved to -->
            <label
              for="curator-comments"
              class="control-label col-md-2"
            >
              Actual nodes
            </label>
            <div class="input-group col-md-10">
              <!-- If phylogenies were loaded, we need to display a selector for each phylogeny -->
              <div class="input-group">
                <!-- Display the phylogeny where this node is expected to match -->
                <span class="input-group-btn">
                  <a
                    class="btn btn-default"
                    :href="'#current_pinning_node_phylogeny' + phylogenyIndex"
                    title="Click here to jump to this node"
                    type="button"
                  >
                    Go to node
                  </a>
                </span>

                <!-- Display the matching node(s)
                <template v-if="!hasProperty(reasoningResults, 'phylorefs')">
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    value="Click 'Reason' to reason over all phyloreferences."
                  >
                </template>
                <template v-else>
                  <template v-if="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length === 0">
                    <!-- We matched no nodes
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="'No nodes could be matched'"
                    >
                  </template>
                  <template v-if="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length === 1">
                    <!-- We matched exactly one node
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny, false)[0]"
                    >
                  </template>
                  <template v-if="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length > 1">
                    <!-- We matched more than one node
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length + ' nodes matched: ' + getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny, false).join(', ')"
                    >
                  </template>
                </template>

                <!-- Display a button that activates reasoning.
                <div class="input-group-btn">
                  <button
                    type="button"
                    class="btn btn-primary start-reasoning"
                    @click="reasonOverPhyloreferences()"
                  >
                    Reason
                  </button>
                </div> -->
              </div>
            </div>

            <!-- Display the phylogeny -->
            <div
              class="card"
              style="margin-top: 1em"
            >
              <Phylotree :newick="phylogeny.newick" />
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import SpecifierDiv from '../phyloref/SpecifierDiv.vue';
import ModifiedCard from '../cards/ModifiedCard.vue';
import Phylotree from '../phylogeny/Phylotree.vue';

export default {
  name: 'PhylorefView',
  components: {
    ModifiedCard,
    SpecifierDiv,
    Phylotree,
  },
  computed: {
    selectedPhylorefLabel: {
      get () { return this.selectedPhyloref['label']; },
      set (label) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, label }); },
    },
    selectedCladeDefinition: {
      get () { return this.selectedPhyloref['cladeDefinition']; },
      set (cladeDefinition) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, cladeDefinition }); },
    },
    selectedCuratorComments: {
      get () { return this.selectedPhyloref['curatorComments']; },
      set (curatorComments) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, curatorComments }); },
    },
    ...mapState({
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
      display: state => state.ui.display,
      selectedPhylogeny: state => state.ui.display.phylogeny,
      selectedPhyloref: state => state.ui.display.phyloref,
    })
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
