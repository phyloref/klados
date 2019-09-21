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
                placeholder="Enter phylogeny name"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              for="phylogenyDescription"
              class="col-md-2 col-form-label"
            >
              Description
            </label>
            <div class="col-md-10">
              <textarea
                id="phylogenyDescription"
                v-model.trim="phylogenyDescription"
                type="text"
                class="form-control"
                placeholder="Enter phylogeny description"
              />
            </div>
          </div>

          <!-- Primary reference phylogeny -->
          <Citation
            label="Primary reference phylogeny"
            :object="selectedPhylogeny"
            citation-key="primaryPhylogenyCitation"
          />

          <!-- Other reference phylogeny -->
          <Citation
            label="Reference phylogeny"
            :object="selectedPhylogeny"
            citation-key="phylogenyCitation"
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
  </div>
</template>

<script>
/*
 * This view displays a phylogeny and changes its title or Newick string.
 */

import { has } from 'lodash';
import { mapState } from 'vuex';
import { parse as parseNewick } from 'newick-js';

import ModifiedCard from '../cards/ModifiedCard.vue';
import Phylotree from './Phylotree.vue';
import Citation from '../citations/Citation.vue';

export default {
  name: 'PhylogenyView',
  components: { ModifiedCard, Phylotree, Citation },
  computed: {
    /*
     * The following properties allow you to get or set the phylogeny label,
     * description or newick string.
     */
    phylogenyLabel: {
      get() { return this.selectedPhylogeny.label; },
      set(label) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, label }); },
    },
    phylogenyDescription: {
      get() { return this.selectedPhylogeny.description; },
      set(description) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, description }); },
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
    ...mapState({
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      selectedPhylogeny: state => state.ui.display.phylogeny,
    }),
  },
};
</script>
