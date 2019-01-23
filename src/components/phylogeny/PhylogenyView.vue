<template>
  <div>
    <!-- Add a warning if this phylogeny has changed -->
    <ModifiedCard
      message="This phylogeny has been modified since being loaded. Use 'Save as JSON' to save your changes."
      :compare="selectedPhylogeny"
      :compareTo="loadedPhyx.phylogenies[currentPhyx.phylogenies.indexOf(selectedPhylogeny)]"
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
      v-if="true || getPhylogenyParsingErrors(selectedPhylogeny).length !== 0"
      class="card border-dark"
    >
      <div class="card-header bg-danger">
        Errors occurred while parsing Newick string
      </div>
      <div class="card-body">
        <template v-for="(error, errorIndex) of getPhylogenyParsingErrors(selectedPhylogeny)">
          <p><strong>{{ error.title }}.</strong> {{ error.message }}</p>
        </template>
      </div>
    </div>

    <!-- Display the phylogeny (unless there were Newick parsing errors) -->
    <div
      v-if="true || getPhylogenyParsingErrors(selectedPhylogeny).length === 0"
      class="card"
    >
      <div class="panel-heading">
        Phylogeny visualization
      </div>
      <div class="card-body">
        <Phylotree :newick="phylogenyNewick" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import ModifiedCard from '../cards/ModifiedCard.vue';
import Phylotree from './Phylotree.vue';

export default {
  name: 'PhylogenyView',
  components: { ModifiedCard, Phylotree },
  computed: {
    phylogenyLabel: {
      get() { return this.selectedPhylogeny.label; },
      set(label) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, label }); },
    },
    phylogenyDescription: {
      get() { return this.selectedPhylogeny.description; },
      set(description) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, description }); },
    },
    phylogenyNewick: {
      get() { return this.selectedPhylogeny.newick; },
      set(newick) { this.$store.commit('setPhylogenyProps', { phylogeny: this.selectedPhylogeny, newick }); },
    },
    ...mapState({
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
      selectedPhylogeny: state => state.ui.display.phylogeny,
      selectedPhylogenyIndex: state => state.phyx.currentPhyx.phylogenies.indexOf(state.ui.display.phylogeny),
        // PLEASE DELETE THIS
    })
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

</style>
