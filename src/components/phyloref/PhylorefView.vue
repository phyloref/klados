<template>
  <div>
    <!-- Add a warning if this phyloreference has changed -->
    <ModifiedCard
      message="This phyloreference has been modified since being loaded! Use 'Save' to save your changes."
      :compare="selectedPhyloref"
      :compare-to="loadedPhyx.phylorefs[currentPhyx.phylorefs.indexOf(selectedPhyloref)]"
    />

    <!-- Phyloreference information -->
    <div
      v-if="!display.phylogeny"
      class="card"
    >
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

          <!-- TODO add definition authors here -->

          <!-- Pre-existing definition source -->
          <Citation
            label="Name published in"
            :object="selectedPhyloref"
            citation-key="dwc:namePublishedIn"
          />

          <!-- Phyloreference clade definition -->
          <div class="form-group row">
            <label
              for="definition"
              class="col-form-label col-md-2"
            >
              Definition in free-form text
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

          <!-- Phyloref definition source -->
          <Citation
            label="Definition published in"
            :object="selectedPhyloref"
            citation-key="obo:IAO_0000119"
          />

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
                placeholder="e.g. 'Specifier X not included in reference phylogeny'"
              />
            </div>
          </div>
        </form>
      </div>

      <div class="card-footer">
        <div class="btn-group" role="group" area-label="Phyloreference management">
          <button
            class="btn btn-primary"
            @click="$store.commit('duplicatePhyloref', { phyloref: selectedPhyloref })"
          >Duplicate phyloreference</button>
        </div>
      </div>
    </div>

    <div class="card mt-2">
      <h5 class="card-header">
        Specifiers
      </h5>
      <div class="card-body">
        <form>
          <!-- Phyloreference type -->
          <div class="form-group row">
            <label
              for="phyloref-type"
              class="col-form-label col-md-2"
            >
              Phyloreference type
            </label>
            <div class="col-md-10">
              <input
                id="phyloref-type"
                v-model="computedPhylorefType"
                type="text"
                readonly
                class="form-control"
              >
            </div>
          </div>
        </form>

        <h5>Internal specifiers</h5>

        <template v-if="!selectedPhyloref.internalSpecifiers || selectedPhyloref.internalSpecifiers.length === 0">
          <p><em>No internal specifiers in this phyloreference.</em></p>
        </template>
        <div
          v-for="(specifier, index) of selectedPhyloref.internalSpecifiers"
          class="form-row input-group"
        >
          <Specifier
            v-bind:key="'internal' + index"
            :phyloref="selectedPhyloref"
            :remote-specifier="specifier"
            :remote-specifier-id="'internal' + index"
          />
        </div>

        <h5 class="mt-2">External specifiers</h5>

        <template v-if="!selectedPhyloref.externalSpecifiers  || selectedPhyloref.externalSpecifiers.length === 0">
          <p><em>No external specifiers in this phyloreference.</em></p>
        </template>
        <div
          v-for="(specifier, index) of selectedPhyloref.externalSpecifiers"
          class="form-row input-group"
        >
          <Specifier
            v-bind:key="'external' + index"
            :phyloref="selectedPhyloref"
            :remote-specifier="specifier"
            :remote-specifier-id="'external' + index"
          />
        </div>
      </div>
      <div class="card-footer">
        <div class="btn-group" role="group" area-label="Internal specifier management">
          <button
            class="btn btn-primary"
            href="javascript:;"
            @click="$store.commit('addInternalSpecifier', { phyloref: selectedPhyloref })"
          >
            Add internal specifier
          </button>
        </div>
        <div class="btn-group ml-2" role="group" area-label="External specifier management">
          <button
            class="btn btn-primary"
            href="javascript:;"
            @click="$store.commit('addExternalSpecifier', { phyloref: selectedPhyloref })"
          >
            Add external specifier
          </button>
        </div>
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
            Expected and actual resolution <span v-if="display.phylogeny">
              of {{ phyloref.label || 'unlabeled phyloreference' }}
            </span> on {{ phylogeny.label || `Phylogeny ${phylogenyIndex + 1}` }}
          </h5>
          <div class="card-body">
            <div class="form-row">
              <!-- Node(s) this phyloreference is expected to resolve to -->
              <label
                for="expected-nodes"
                class="col-form-label col-md-2"
              >
                Expected nodes
              </label>

              <div class="input-group col-md-10 pb-2">
                <!-- Display the phylogeny where this node is expected to match -->
                <div class="input-group-prepend">
                  <a
                    class="btn btn-outline-secondary"
                    :href="'#current_expected_label_phylogeny_' + phylogenyIndex"
                    title="Click here to jump to the expected label"
                    role="button"
                  >Go to node</a>
                </div>

                <!-- Display the matching node(s) -->
                <template v-if="getExpectedNodeLabels(phylogeny).length === 0">
                  <!-- We matched no nodes -->
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="'No node labeled \'' + selectedPhylorefLabel + '\' found in phylogeny'"
                  >
                </template>

                <template v-if="getExpectedNodeLabels(phylogeny).length === 1">
                  <!-- We matched exactly one node -->
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getExpectedNodeLabels(phylogeny)[0]"
                  >
                </template>

                <template v-if="getExpectedNodeLabels(phylogeny).length > 1">
                  <!-- We matched more than one node -->
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getExpectedNodeLabels(phylogeny).length + ' nodes matched: ' + getExpectedNodeLabels(phylogeny, selectedPhyloref).join(', ')"
                  >
                </template>

                <!-- Display a dropdown menu that allows the modified label to be changed. -->
                <div class="input-group-append">
                  <button
                    id="expected-nodes-dropdown"
                    type="button"
                    class="btn btn-outline-secondary dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Change <span class="caret" />
                  </button>
                  <div
                    class="dropdown-menu dropright"
                    aria-labelledby="expected-nodes-dropdown"
                    style="height: 30em; overflow: visible scroll;"
                  >
                    <a class="dropdown-header">
                      Labeled internal nodes in this phylogeny
                    </a>
                    <a
                      v-for="nodeLabel of getNodeLabels(phylogeny, 'internal')"
                      class="dropdown-item"
                      :class="{active: getExpectedNodeLabels(phylogeny).includes(nodeLabel)}"
                      href="#selected-phyloref"
                      @click="togglePhylorefExpectedNodeLabel(phylogeny, selectedPhyloref, nodeLabel)"
                    >
                      {{ nodeLabel }}
                    </a>
                    <div class="dropdown-divider" />
                    <a class="dropdown-header">
                      Labeled terminal nodes in this phylogeny
                    </a>
                    <a
                      v-for="nodeLabel of getNodeLabels(phylogeny, 'terminal')"
                      class="dropdown-item"
                      :class="{active: getExpectedNodeLabels(phylogeny).includes(nodeLabel)}"
                      href="#selected-phyloref"
                      @click="togglePhylorefExpectedNodeLabel(phylogeny, selectedPhyloref, nodeLabel)"
                    >
                      {{ nodeLabel }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Node(s) this phyloreference actually resolved to -->
              <label
                for="actual-nodes"
                class="col-form-label col-md-2 pb-2"
              >
                Actual resolved nodes
              </label>

              <div class="input-group col-md-10 pb-2">
                <!-- Display the phylogeny where this node is expected to match -->
                <div class="input-group-prepend">
                  <a
                    class="btn btn-outline-secondary"
                    :href="'#current_pinning_node_phylogeny_' + phylogenyIndex"
                    title="Click here to jump to this node"
                    role="button"
                  >Go to node</a>
                </div>

                <!-- Display the matching node(s) -->
                <template v-if="!$store.state.resolution.reasoningResults">
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    value="Click 'Reason' to reason over all phyloreferences."
                  />
                </template>
                <template v-else>
                  <template v-if="getResolvedNodes(phylogeny).length === 0">
                    <!-- We matched no nodes -->
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="'No nodes could be resolved'"
                    />
                  </template>
                  <template v-if="getResolvedNodes(phylogeny).length === 1">
                    <!-- We matched exactly one node -->
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodes(phylogeny)[0]"
                    />
                  </template>
                  <template v-if="getResolvedNodes(phylogeny).length > 1">
                    <!-- We matched more than one node -->
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodes(phylogeny).length + ' nodes matched: ' + getResolvedNodes(phylogeny).join(', ')"
                    />
                  </template>
                </template>
              </div>
            </div>

            <!-- Display the phylogeny -->
            <div
              class="card mt-4 p-2"
            >
              <Phylotree
                :phylogeny-index="String(phylogenyIndex)"
                :phylogeny="phylogeny"
                :phyloref="selectedPhyloref"
                :newick="phylogeny.newick"
              />
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
/*
 * A view for displaying a phyloreference and how it resolves on all phylogenies.
 */

import { mapState } from 'vuex';
import { has } from 'lodash';
import { PhylogenyWrapper, PhylorefWrapper } from '@phyloref/phyx';

import ModifiedCard from '../cards/ModifiedCard.vue';
import Phylotree from '../phylogeny/Phylotree.vue';
import Citation from '../citations/Citation.vue';
import Specifier from '../specifiers/Specifier.vue';

export default {
  name: 'PhylorefView',
  components: {
    ModifiedCard,
    Phylotree,
    Citation,
    Specifier,
  },
  computed: {
    /*
     * The following properties allow you to get or set phyloref label, clade definition or curator comments.
     */
    selectedPhylorefLabel: {
      get() { return this.selectedPhyloref.label; },
      set(label) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, label }); },
    },
    selectedCladeDefinition: {
      get() { return this.selectedPhyloref.cladeDefinition; },
      set(cladeDefinition) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, cladeDefinition }); },
    },
    selectedCuratorComments: {
      get() { return this.selectedPhyloref.curatorComments; },
      set(curatorComments) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, curatorComments }); },
    },
    computedPhylorefType() {
      return this.$store.getters.getPhylorefType(this.selectedPhyloref);
    },
    phylorefURI() {
      // Get the base URI of this phyloreference.
      return this.$store.getters.getBaseURIForPhyloref(this.selectedPhyloref);
    },
    noSpecifiers() {
      // Return true if no specifiers are present.
      return (
        (this.selectedPhyloref.internalSpecifiers || []).length === 0
        && (this.selectedPhyloref.externalSpecifiers || []).length === 0
      );
    },

    ...mapState({
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
      display: state => state.ui.display,
      selectedPhylogeny: state => state.ui.display.phylogeny,
      selectedPhyloref: state => state.ui.display.phyloref,
    }),
  },
  methods: {
    getNodeLabels(phylogeny, nodeType) {
      // Return a list of node labels in a particular phylogeny.
      return new PhylogenyWrapper(phylogeny).getNodeLabels(nodeType).sort();
    },
    getExpectedNodeLabels(phylogeny) {
      // Return a list of nodes that this phyloreference is expected to resolve to.
      return new PhylorefWrapper(this.selectedPhyloref).getExpectedNodeLabels(phylogeny);
    },
    getSpecifierLabel(specifier) {
      // Return the specifier label of a particular specifier.
      return PhylorefWrapper.getSpecifierLabel(specifier);
    },
    getResolvedNodes(phylogeny, flagReturnShortURIs = true) {
      // Return the list of nodes on a particular phylogeny that this phyloreference
      // has been determined to resolve on by JPhyloRef.
      return this.$store.getters.getResolvedNodesForPhylogeny(phylogeny, this.selectedPhyloref, flagReturnShortURIs);
    },
  },
};
</script>
