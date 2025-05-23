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
          <!-- Phyloreference ID -->
          <div class="form-group row">
            <label
              for="phyloref-id"
              class="col-form-label col-md-2"
            >
              Phyloref ID (should be a <a target="_blank" href="https://en.wikipedia.org/wiki/Uniform_Resource_Identifier">URI</a>)
            </label>
            <div class="col-md-10">
              <input
                id="phyloref-id"
                v-model.lazy="selectedPhylorefID"
                type="text"
                placeholder="A global or local identifier for this phyloreference, e.g. 'http://doi.org/10.13/49#12' or '#phyloref1'"
                class="form-control"
              >
            </div>
          </div>

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
              >
            </div>
          </div>

          <!-- TODO add definition authors here -->

          <!-- Pre-existing definition source -->
          <Citation
            label="Name published in"
            :object="selectedPhyloref"
            citation-key="namePublishedIn"
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
                placeholder="e.g. 'The largest crown clade containing Canis lupus Linnaeus 1758 (Canidae) but not Felis silvestris Schreber 1777 (Felidae).'"
                rows="6"
              />
            </div>
          </div>

          <!-- Phyloref definition source -->
          <Citation
            label="Definition published in"
            :object="selectedPhyloref"
            citation-key="definitionSource"
          />

          <!-- Phyloreference curator notes -->
          <div class="form-group row">
            <label
              for="curator-notes"
              class="col-form-label col-md-2"
            >
              Curator notes
            </label>
            <div class="col-md-10">
              <textarea
                id="curator-notes"
                v-model.lazy="selectedCuratorNotes"
                class="form-control"
                rows="2"
                placeholder="e.g. 'Specifier X not included in reference phylogeny'"
              />
            </div>
          </div>
        </form>
      </div>

      <div class="card-footer">
        <div
          class="btn-group"
          role="group"
          area-label="Phyloreference management"
        >
          <button
            class="btn btn-primary"
            @click="$store.commit('duplicatePhyloref', { phyloref: selectedPhyloref })"
          >
            Duplicate phyloreference
          </button>

          <button
            class="btn btn-danger"
            @click="deleteThisPhyloref()"
          >
            Delete phyloreference
          </button>
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

        <div class="card">
          <div class="card-header">
            <button
              class="btn btn-secondary btn-sm float-right"
              href="javascript:;"
              @click="$store.commit('addInternalSpecifier', { phyloref: selectedPhyloref })"
            >
              <b-icon-plus-square />
            </button>
            <h5>Internal specifiers</h5>
          </div>
          <div class="card-body">
            <template
              v-if="!selectedPhyloref.internalSpecifiers || selectedPhyloref.internalSpecifiers.length === 0"
            >
              <p><em>No internal specifiers in this phyloreference.</em></p>
            </template>
            <div
              v-for="(specifier, index) of selectedPhyloref.internalSpecifiers"
              class="form-row input-group"
            >
              <Specifier
                :key="'internal' + index"
                :phyloref="selectedPhyloref"
                :remote-specifier="specifier"
                :remote-specifier-id="'internal' + index"
              />
            </div>
          </div>
        </div>

        <div class="card mt-2">
          <div class="card-header">
            <button
              class="btn btn-secondary btn-sm float-right"
              href="javascript:;"
              @click="$store.commit('addExternalSpecifier', { phyloref: selectedPhyloref })"
            >
              <b-icon-plus-square />
            </button>
            <h5>External specifiers</h5>
          </div>
          <div class="card-body">
            <template
              v-if="!selectedPhyloref.externalSpecifiers || selectedPhyloref.externalSpecifiers.length === 0"
            >
              <p><em>No external specifiers in this phyloreference.</em></p>
            </template>
            <div
              v-for="(specifier, index) of selectedPhyloref.externalSpecifiers"
              class="form-row input-group"
            >
              <Specifier
                :key="'external' + index"
                :phyloref="selectedPhyloref"
                :remote-specifier="specifier"
                :remote-specifier-id="'external' + index"
              />
            </div>
          </div>
        </div>

        <div class="card mt-2">
          <div class="card-header">
            <h5>
              <button
                v-if="hasApomorphy"
                class="btn btn-secondary btn-sm float-right"
                href="javascript:;"
                @click="hasApomorphy = !hasApomorphy"
              >
                <b-icon-check-square />
              </button>
              <button
                v-if="!hasApomorphy"
                class="btn btn-secondary btn-sm float-right"
                href="javascript:;"
                @click="hasApomorphy = !hasApomorphy"
              >
                <b-icon-square />
              </button>
              Apomorphy
            </h5>
          </div>
          <div class="card-body">
            <div v-if="!hasApomorphy">
              <p><em>No apomorphy in this phyloreference.</em></p>
            </div>

            <template v-if="hasApomorphy">
              <div class="form-group row">
                <label
                  for="apomorphy-definition"
                  class="col-form-label col-md-2"
                >
                  Definition
                </label>
                <div class="col-md-10">
                  <textarea
                    id="apomorphy-definition"
                    class="form-control"
                    rows="2"
                    placeholder="e.g. 'A complete turtle shell as inherited by Testudo graeca.'"
                    v-model="selectedPhyloref.apomorphy.definition"
                  />
                </div>
              </div>

              <div class="form-group row">
                <label
                  for="bearing-entity"
                  class="col-form-label col-md-2"
                >
                  Bearing entity
                </label>
                <div class="col-md-10">
                  <div class="input-group">
                    <input
                      id="bearing-entity"
                      class="form-control"
                      placeholder="e.g. 'http://purl.obolibrary.org/obo/UBERON_0008271'"
                      v-model="selectedPhyloref.apomorphy.bearingEntity"
                    >
                    <div class="input-group-append">
                      <a
                        class="btn btn-outline-secondary align-middle"
                        target="_blank"
                        style="vertical-align: middle"
                        :href="selectedPhyloref.apomorphy.bearingEntity"
                      >
                        Open in new window
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group row">
                <label
                  for="phenotypic-quality"
                  class="col-form-label col-md-2"
                >
                  Phenotypic Quality
                </label>
                <div class="col-md-10">
                  <div class="input-group">
                    <input
                      id="phenotypic-quality"
                      class="form-control"
                      placeholder="e.g. 'http://purl.obolibrary.org/obo/PATO_0000467'"
                      v-model="selectedPhyloref.apomorphy.phenotypicQuality"
                    >
                    <div class="input-group-append">
                      <a
                        class="btn btn-outline-secondary align-middle"
                        target="_blank"
                        style="vertical-align: middle"
                        :href="selectedPhyloref.apomorphy.phenotypicQuality"
                      >
                        Open in new window
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
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
            <!-- Reference phylogeny information -->
            <Citation
              label="Reference phylogeny"
              :object="phylogeny"
              citation-key="primaryPhylogenyCitation"
            />

            <!-- Expected resolution information -->
            <div class="form-group row">
              <label
                :for="'expected-resolution-' + phylogenyIndex"
                class="col-form-label col-md-2"
              >
                Expected resolution in free-form text
              </label>
              <div class="col-md-10">
                <textarea
                  :id="'expected-resolution-' + phylogenyIndex"
                  :value="getExpectedResolution(phylogeny).description"
                  rows="3"
                  class="form-control"
                  placeholder="e.g. 'Should resolve to clade X in fig 3 of Smith 2003'"
                  @change="setExpectedResolution(phylogeny, {'description': $event.target.value})"
                />
              </div>
            </div>

            <div class="form-group row">
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
                  >Scroll to node</a>
                </div>

                <!-- Display the matching node(s) -->
                <template v-if="!getExpectedNodeLabel(phylogeny)">
                  <!-- We matched no nodes -->
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="'No node labeled \'' + selectedPhylorefLabel + '\' found in phylogeny'"
                  >
                </template>

                <template v-if="getExpectedNodeLabel(phylogeny)">
                  <!-- We matched exactly one node -->
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getExpectedNodeLabel(phylogeny)"
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
                      :class="{active: getExpectedNodeLabel(phylogeny) === nodeLabel}"
                      href="#selected-phyloref"
                      @click="setExpectedResolution(phylogeny, {nodeLabel})"
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
                      :class="{active: getExpectedNodeLabel(phylogeny) === nodeLabel}"
                      href="#selected-phyloref"
                      @click="setExpectedResolution(phylogeny, {nodeLabel})"
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
                  >Scroll to node</a>
                </div>

                <!-- Display the matching node(s) -->
                <template v-if="!$store.state.resolution.reasoningResults">
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    value="Click 'Resolve against phylogenies' to reason over all phyloreferences."
                  >
                </template>
                <template v-else>
                  <template v-if="getResolvedNodeLabels(phylogeny).length === 0">
                    <!-- We matched no nodes -->
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="'No nodes could be resolved'"
                    >
                  </template>
                  <template v-if="getResolvedNodeLabels(phylogeny).length === 1">
                    <!-- We matched exactly one node -->
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodeLabels(phylogeny)[0]"
                    >
                  </template>
                  <template v-if="getResolvedNodeLabels(phylogeny).length > 1">
                    <!-- We matched more than one node -->
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodeLabels(phylogeny).length + ' nodes matched: ' + getResolvedNodeLabels(phylogeny).join(', ')"
                    >
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
                :phylorefs="[selectedPhyloref]"
                :newick="phylogeny.newick"
                :selected-node-label="getExpectedNodeLabel(phylogeny)"
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

import Vue from 'vue';
import { mapState } from 'vuex';
import { has, cloneDeep } from 'lodash';
import { PhylogenyWrapper, PhylorefWrapper } from '@phyloref/phyx';
import {
  BIconSquare, BIconCheck, BIconCheckSquare, BIconPlusSquare,
} from 'bootstrap-vue';

import ModifiedCard from '../cards/ModifiedCard.vue';
import Phylotree from '../phylogeny/Phylotree.vue';
import Citation from '../citations/Citation.vue';
import Specifier from '../specifiers/Specifier.vue';
import { newickParser } from "phylotree";

export default {
  name: 'PhylorefView',
  components: {
    ModifiedCard,
    Phylotree,
    Citation,
    Specifier,
    BIconSquare,
    BIconCheck,
    BIconCheckSquare,
    BIconPlusSquare,
  },
  data() {
    return {
      previousApomorphy: {},
    };
  },
  computed: {
    /*
     * The following properties allow you to get or set phyloref label, clade definition or curator comments.
     */
    selectedPhylorefID: {
      get() { return this.selectedPhyloref['@id']; },
      set(id) {
        // Is there any other phyloref in this file with that identifier? If so, raise an error.
        if ((this.currentPhyx.phylorefs || [])
          // Don't compare it to itself.
          .filter(phyloref => phyloref !== this.selectedPhyloref)
          // Check if the ID is identical to another phyloref.
          .filter(phyloref => phyloref['@id'] === id)
          // Did we find any?
          .length > 0) {
          alert("Could not set phyloref ID to " + id + ": already used by another phyloref.");
          return false;
        }

        // If any part of the Phyx file references this phyloref, we would need
        // to update those references as well -- this is needed for phylogenies,
        // which uses this.$store.dispatch('changePhylogenyId').
        //
        // However, as of right now, there shouldn't be any references to this
        // phyloref anywhere else in the Phyx file, so we can just set it as a
        // property.
        this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, '@id': id });
      },
    },
    selectedPhylorefLabel: {
      get() { return this.selectedPhyloref.label; },
      set(label) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, label }); },
    },
    selectedCladeDefinition: {
      get() { return this.selectedPhyloref.definition; },
      set(definition) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, definition }); },
    },
    selectedCuratorNotes: {
      get() { return this.selectedPhyloref.curatorNotes; },
      set(curatorNotes) { this.$store.commit('setPhylorefProps', { phyloref: this.selectedPhyloref, curatorNotes }); },
    },
    computedPhylorefType() {
      // Return the type of phyloreference based on internal/external specifier structure.
      return this.$store.getters.getPhylorefTypeDescription(this.selectedPhyloref);
    },
    phylorefURI() {
      // Get the base URI of this phyloreference.
      return this.$store.getters.getPhylorefId(this.selectedPhyloref);
    },
    noSpecifiers() {
      // Return true if no specifiers are present.
      return (
        (this.selectedPhyloref.internalSpecifiers || []).length === 0
        && (this.selectedPhyloref.externalSpecifiers || []).length === 0
      );
    },
    hasApomorphy: {
      get() {
        // Return true if this phyloref includes an apomorphy.
        return has(this.selectedPhyloref, 'apomorphy');
        // return this.$store.getters.isApomorphyBasedPhyloref(this.selectedPhyloref);
      },
      set(flag) {
        console.debug(`Setting hasApomorphy to ${flag} with apomorphy at ${this.selectedPhyloref.apomorphy} but ${has(this.selectedPhyloref, 'apomorphy')}`);
        // Either create or delete the apomorphy information depending on the boolean value flag.
        if (flag) {
          // Make sure an 'apomorphy' field exists.
          if (!has(this.selectedPhyloref, 'apomorphy')) {
            this.$store.commit('setPhylorefProps', {
              phyloref: this.selectedPhyloref,
              apomorphy: this.previousApomorphy || {},
            });
          }
        } else {
          // Make sure an 'apomorphy' field doesn't exist.
          // While this component is being displayed, we can store a previously set apomorphy so
          // that the user can "undo" deleting an apomorphy without losing information.
          // eslint-disable-next-line no-lonely-if
          if (has(this.selectedPhyloref, 'apomorphy')) {
            this.previousApomorphy = this.selectedPhyloref.apomorphy;
            this.$store.commit('setPhylorefProps', {
              phyloref: this.selectedPhyloref,
              deleteFields: ['apomorphy'],
            });
          }
        }
      },
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
    getExpectedResolution(phylogeny) {
      // Get the expected resolution information for this phyloreference on
      // a particular phylogeny.
      return this.$store.getters.getExpectedResolution(
        this.selectedPhyloref,
        phylogeny,
      );
    },
    setExpectedResolution(phylogeny, payload) {
      // Set the expected resolution information for this phyloreference on
      // a particular phylogeny.
      this.$store.dispatch('setExpectedResolution', {
        phyloref: this.selectedPhyloref,
        phylogeny,
        expectedResolutionData: payload,
      });
    },
    getNodeLabels(phylogeny, nodeType) {
      // Return a list of node labels in a particular phylogeny.
      try {
        return new PhylogenyWrapper(phylogeny).getNodeLabels(nodeType).sort();
      } catch {
        return [];
      }
    },
    getExpectedNodeLabel(phylogeny) {
      // Return the node label we expect this phyloref to resolve to on the
      // specified phylogeny.
      return this.$store.getters.getExpectedNodeLabel(
          this.selectedPhyloref,
          phylogeny,
      );
    },
    getNodesById(phylogeny, nodeId) {
      // Return all node labels with this nodeId in this phylogeny.
      let parsed;
      try {
        parsed = new PhylogenyWrapper(phylogeny).getParsedNewickWithIRIs(
          this.$store.getters.getPhylogenyId(phylogeny),
          newickParser,
        );
      } catch {
        return [];
      }

      function searchNode(node, results = []) {
        if (has(node, "@id") && node["@id"] === nodeId) {
          results.push(node);
        }
        if (has(node, "children")) {
          node.children.forEach((child) => searchNode(child, results));
        }
        return results;
      }

      if (!has(parsed, "json")) return [];
      return searchNode(parsed.json);
    },
    getResolvedNodeLabels(phylogeny) {
      // Return the list of nodes on a particular phylogeny that this phyloreference
      // has been determined to resolve on by JPhyloRef.
      //
      // TODO: this is duplicated from getNodeLabelsResolvedByPhyloref() in PhyxView,
      // so at some point it should be consolidated into a single location.
      const resolvedNodes = this.$store.getters.getResolvedNodesForPhylogeny(phylogeny, this.selectedPhyloref);

      return resolvedNodes
        .map((nodeId) => this.getNodesById(phylogeny, nodeId))
        .reduce((a, b) => a.concat(b), [])
        .map(
          (node) =>
            (has(node, "@id") ? node["@id"] : "(no ID)") +
            ' ("' +
            (node.name || "unlabelled") +
            '")'
        );
    },
    deleteThisPhyloref() {
      // Delete this phyloreference, and unset the selected phyloref so we return to the summary page.
      if (confirm('Are you sure you wish to delete this phyloreference? This cannot be undone!')) {
        this.$store.commit('deletePhyloref', {
          phyloref: this.selectedPhyloref,
        });
        this.$store.commit('changeDisplay', {});
      }
    },
  },
};
</script>
