<template>
  <div>
    <!-- Add a warning if this phylogeny has changed -->
    <ModifiedCard
      message="This phylogeny has been modified since being loaded. Use 'Save' to save your changes."
      :compare="selectedPhylogeny"
      :compare-to="loadedPhyx.phylogenies[currentPhyx.phylogenies.indexOf(selectedPhylogeny)]"
    />

    <div class="card">
      <h5 class="card-header">
        Phylogeny information
      </h5>
      <div class="card-body">
        <form>
          <div class="form-group row">
            <label
              for="phylogenyId"
              class="col-md-2 col-form-label"
            >
              Identifier
            </label>
            <div class="col-md-10">
              <input
                id="phylogenyId"
                v-model="phylogenyId"
                type="text"
                class="form-control"
                :class="{'border-danger': phylogenyIdError}"
                placeholder="A global or local identifier for this phylogeny, e.g. 'http://doi.org/10.13/49#12' or '#phylogeny1'"
              >
              <p
                v-if="phylogenyIdError"
                class="form-text text-danger"
              >
                {{ phylogenyIdError }}
              </p>
            </div>
          </div>

          <div class="form-group row">
            <label
              for="phylogenyLabel"
              class="col-md-2 col-form-label"
            >
              Label
            </label>
            <div class="col-md-10">
              <input
                id="phylogenyLabel"
                v-model.trim="phylogenyLabel"
                type="text"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              for="phylogenyCuratorNotes"
              class="col-md-2 col-form-label"
            >
              Curator notes
            </label>
            <div class="col-md-10">
              <textarea
                id="phylogenyCuratorNotes"
                v-model.trim="phylogenyCuratorNotes"
                type="text"
                class="form-control"
                placeholder="Enter curator notes for this phylogeny, such as any differences from its published form."
              />
            </div>
          </div>

          <!-- Source -->
          <Citation
            label="Source"
            :object="selectedPhylogeny"
            citation-key="source"
          />

          <div class="form-group row">
            <label
              for="newick"
              class="col-md-2 control-label"
            >
              Newick
            </label>
            <div class="col-md-10 input-group">
              <textarea
                v-model.lazy="phylogenyNewick"
                rows="5"
                class="form-control"
                placeholder="Enter Newick string for phylogeny here"
              />
            </div>
          </div>
        </form>
      </div>

      <div class="card-footer">
        <div
          class="btn-group"
          role="group"
          area-label="Phylogeny management"
        >
          <button
            class="btn btn-danger"
            @click="deleteThisPhylogeny()"
          >
            Delete phylogeny
          </button>
        </div>
      </div>
    </div>

    <!-- Display the list of errors encountered when parsing this Newick string -->
    <div
      v-if="phylogenyNewickErrors.length !== 0"
      class="card border-dark mt-2"
    >
      <h5 class="card-header bg-danger">
        Errors occurred while parsing Newick string
      </h5>
      <div class="card-body">
        <template v-for="(error, errorIndex) of phylogenyNewickErrors">
          <p><strong>{{ error.title }}.</strong> {{ error.message }}</p>
        </template>
      </div>
    </div>

    <!-- Display the phylogeny (unless there were Newick parsing errors) -->
    <div
      v-if="phylogenyNewickErrors.length === 0"
      class="card mt-2"
    >
      <h5 class="card-header">
        Phylogeny visualization
      </h5>
      <div class="card-body">
        <Phylotree
          :phylogeny="selectedPhylogeny"
        />
      </div>
    </div>

    <!-- Display taxonomic units in this phylogeny -->
    <div class="card mt-2">
      <h5 class="card-header">
        Taxonomic units in this phylogeny
      </h5>
      <div class="card-body">
        To add additional taxonomic units to this list, please label the corresponding node on the phylogeny.
      </div>

      <b-table
        striped
        hover
        :items="taxonomicUnitsTable"
        :fields="['node_label', 'node_type', 'show_details']"
        :primary-key="node_label"
        show-empty
      >
        <template #empty="scope">
          <h4>No labels found in this phylogeny.</h4>
        </template>
        <template #emptyfiltered="scope">
          <h4>No labels found after filtering.</h4>
        </template>
        <template #cell(show_details)="row">
          <b-form-checkbox v-model="row.detailsShowing" @change="row.toggleDetails">
            Node has additional taxonomic units
          </b-form-checkbox>
        </template>

          <template #row-details="row">
              <b-card>
                  <b-row class="mb-2">
                      <b-col sm="3" class="text-sm-right"><b>Age:</b></b-col>
                      <b-col>{{ row.item.age }}</b-col>
                  </b-row>

                  <b-row class="mb-2">
                      <b-col sm="3" class="text-sm-right"><b>Is Active:</b></b-col>
                      <b-col>{{ row.item.isActive }}</b-col>
                  </b-row>

                  <b-button size="sm" @click="row.toggleDetails">Hide Details</b-button>
              </b-card>
          </template>
      </b-table>
    </div>
  </div>
</template>

<script>
/*
 * This view displays a phylogeny and changes its title or Newick string.
 */

import { has } from 'lodash';
import { mapState } from 'vuex';
import { parse as parseNewick } from 'newick-js';

import { PhylogenyWrapper } from '@phyloref/phyx';
import ModifiedCard from '../cards/ModifiedCard.vue';
import Phylotree from './Phylotree.vue';
import Citation from '../citations/Citation.vue';

export default {
  name: 'PhylogenyView',
  components: { ModifiedCard, Phylotree, Citation },
  data() {
    return {
      // Errors in the phylogenyId field.
      phylogenyIdError: undefined,
    };
  },
  methods: {
    deleteThisPhylogeny() {
      // Delete this phylogeny, and unset the selected phylogeny so we return to the summary page.
      if (confirm('Are you sure you wish to delete this phylogeny? This cannot be undone!')) {
        this.$store.commit('deletePhylogeny', {
          phylogeny: this.selectedPhylogeny,
        });
        this.$store.commit('changeDisplay', {});
      }
    },
  },
  computed: {
    /*
     * The following properties allow you to get or set the phylogeny label,
     * description or newick string.
     */
    phylogenyId: {
      // The phylogeny identifier; either a global identifier like http://doi.org/10.3014/3
      // or a local identifier like #phylogeny1.
      get() { return this.$store.getters.getPhylogenyId(this.selectedPhylogeny); },
      set(id) {
        try {
          this.$store.dispatch('changePhylogenyId', { phylogeny: this.selectedPhylogeny, phylogenyId: id });
        } catch (err) {
          // If there was an error in setting phylogeny id, report that to the user.
          this.phylogenyIdError = err;
          return false;
        }
        // Clear previous phylogeny id errors.
        this.phylogenyIdError = undefined;
        return true;
      },
    },
    phylogenyLabel: {
      get() { return this.selectedPhylogeny.label; },
      set(label) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, label }); },
    },
    phylogenyCuratorNotes: {
      get() { return this.selectedPhylogeny.curatorNotes; },
      set(curatorNotes) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, curatorNotes }); },
    },
    phylogenyNewick: {
      get() { return this.selectedPhylogeny.newick || '()'; },
      set(newick) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, newick }); },
    },
    phylogenyNewickErrors() {
      // Given a Newick string, return a list of errors found in parsing this
      // string. The errors are returned as a list of objects, each of which
      // has two properties:
      //  - title: A short title of the error, distinct for each type of error.
      //  - message: A longer description of the error, which might include
      //    information specific to a particular error.
      //
      // We try to order errors from most helpful ('Unbalanced parentheses in
      // Newick string') to least helpful ('Error parsing phylogeny').
      if (!has(this.selectedPhylogeny, 'newick')) return [];
      const newickTrimmed = this.selectedPhylogeny.newick.trim();
      const errors = [];

      // Look for an empty Newick string.
      if (newickTrimmed === '' || newickTrimmed === '()' || newickTrimmed === '();') {
        // None of the later errors are relevant here, so bail out now.
        return [{
          title: 'No phylogeny entered',
          message: 'Click on "Edit as Newick" to enter a phylogeny below.',
        }];
      }

      // Look for an unbalanced Newick string.
      let parenLevels = 0;
      for (let x = 0; x < newickTrimmed.length; x += 1) {
        if (newickTrimmed[x] === '(') parenLevels += 1;
        if (newickTrimmed[x] === ')') parenLevels -= 1;
      }

      if (parenLevels !== 0) {
        errors.push({
          title: 'Unbalanced parentheses in Newick string',
          message: (parenLevels > 0
            ? `You have ${parenLevels} too many open parentheses`
            : `You have ${-parenLevels} too few open parentheses`
          ),
        });
      }

      // Finally, try parsing it with parseNewick and see if we get an error.
      try {
        parseNewick(newickTrimmed);
      } catch (ex) {
        errors.push({
          title: 'Error parsing phylogeny',
          message: `An error occured while parsing this phylogeny: ${ex.message}`,
        });
      }

      return errors;
    },
    taxonomicUnitsTable() {
      // Create a table of taxonomic units found in this phylogeny.
      const terminalLabels = new PhylogenyWrapper(this.selectedPhylogeny).getNodeLabels('terminal').sort();
      const internalLabels = new PhylogenyWrapper(this.selectedPhylogeny).getNodeLabels('internal').sort();

      const hasExplicitTaxonomicUnitsForPhylogenyNode = nodeLabel => (
        this.$store.getters
          .getExplicitTaxonomicUnitsForPhylogenyNode(this.selectedPhylogeny, nodeLabel)
          .length > 0
      );

      return terminalLabels.map(nodeLabel => ({ node_label: nodeLabel, node_type: 'Terminal node', _showDetails: hasExplicitTaxonomicUnitsForPhylogenyNode(nodeLabel) })).concat(
        internalLabels.map(nodeLabel => ({ node_label: nodeLabel, node_type: 'Internal node', _showDetails: hasExplicitTaxonomicUnitsForPhylogenyNode(nodeLabel) })),
      );
    },
    ...mapState({
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      selectedPhylogeny: state => state.ui.display.phylogeny,
    }),
  },
};
</script>
