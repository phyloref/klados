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
              for="phylogenyTitle"
              class="col-md-2 col-form-label"
            >
              Title
            </label>
            <div class="col-md-10">
              <input
                id="phylogenyTitle"
                v-model.trim="phylogenyTitle"
                type="text"
                class="form-control"
                placeholder="Enter phylogeny title"
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
      class="panel panel-warning"
    >
      <div class="panel-heading">
        Errors occurred while parsing Newick string
      </div>
      <div class="panel-body">
        <!-- template v-for="(error, errorIndex) of getPhylogenyParsingErrors(selectedPhylogeny)">
          <p><strong>{{ error.title }}.</strong> {{ error.message }}</p>
        </template> -->
      </div>
    </div>

    <!-- Display the phylogeny (unless there were Newick parsing errors) -->
    <div
      v-if="true || getPhylogenyParsingErrors(selectedPhylogeny).length === 0"
      class="panel panel-info"
    >
      <div class="panel-heading">
        Phylogeny visualization
      </div>
      <div class="panel-body">
        <svg
          :id="'phylogeny-svg-' + selectedPhylogenyIndex"
          width="100%"
          :alt="'test' || getPhylogenyAsNewick('#phylogeny-svg-' + selectedPhylogenyIndex, selectedPhylogeny)"
        />
      </div>
      <div class="panel-footer">
        <div
          class="btn-group btn-group-justified"
          role="group"
          aria-label="Actions for phylogeny"
        >
          <!-- Refresh phylogeny -->
          <a
            href="javascript: void(0)"
            class="btn btn-default"
            @click="resetSVG(); renderTree('#phylogeny-svg-' + selectedPhylogenyIndex, selectedPhylogeny)"
          >
            Refresh
          </a>

          <!-- Dropdown button for vertical spacing -->
          <div
            class="btn-group"
            role="group"
          >
            <button
              type="button"
              class="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Vertical spacing: getPhylogenySpacingX(selectedPhylogenyIndex) px <span class="caret" />
            </button>
            <ul class="dropdown-menu">
              <li>
                <a
                  :href="'#phylogeny-' + selectedPhylogenyIndex + '-footer'"
                  @click="changePhylogenySpacingX(selectedPhylogenyIndex, +10)"
                >
                  Increase scale
                </a>
              </li>
              <li>
                <a
                  :href="'#phylogeny-' + selectedPhylogenyIndex + '-footer'"
                  @click="changePhylogenySpacingX(selectedPhylogenyIndex, -10)"
                >
                  Decrease scale
                </a>
              </li>
            </ul>
          </div>

          <!-- Dropdown button for horizontal spacing -->
          <div
            class="btn-group"
            role="group"
          >
            <button
              type="button"
              class="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Horizontal spacing: getPhylogenySpacingY(selectedPhylogenyIndex) px <span class="caret" />
            </button>
            <ul class="dropdown-menu">
              <li>
                <a
                  :href="'#phylogeny-' + selectedPhylogenyIndex + '-footer'"
                  @click="changePhylogenySpacingY(selectedPhylogenyIndex, +10)"
                >
                  Increase scale
                </a>
              </li>
              <li>
                <a
                  :href="'#phylogeny-' + selectedPhylogenyIndex + '-footer'"
                  @click="changePhylogenySpacingY(selectedPhylogenyIndex, -10)"
                >
                  Decrease scale
                </a>
              </li>
            </ul>
          </div>

          <!--
        <a class="btn btn-default" :href="'#phylogeny-' + phylogenyIndex" @click="editingAnnotationsForPhylogeny = (editingAnnotationsForPhylogeny === phylogeny ? undefined : phylogeny)" class="btn btn-default">Edit annotations</a>
      -->

          <!-- Button to delete this phylogeny -->
          <a
            class="btn btn-danger"
            :href="'#phylogeny-' + selectedPhylogenyIndex"
            @click="confirm('Are you sure you want to permanently delete this phylogeny?', () => phylogenies.splice(selectedPhylogenyIndex, 1))"
          >
            Delete phylogeny
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { _ } from 'underscore';
import { mapState } from 'vuex';

import ModifiedCard from '../cards/ModifiedCard.vue';

export default {
  name: 'PhylogenyView',
  components: { ModifiedCard },
  computed: {
    phylogenyTitle: {
      get() { return this.$store.state.ui.display.phylogeny.title; },
      set(title) { this.$store.commit('setPhylogenyTitle', { phylogeny: this.$store.state.ui.display.phylogeny, title }); },
    },
    phylogenyDescription: {
      get() { return this.$store.state.ui.display.phylogeny.description; },
      set(description) { this.$store.commit('setPhylogenyDescription', { phylogeny: this.$store.state.ui.display.phylogeny, description }); },
    },
    phylogenyNewick: {
      get() { return this.$store.state.ui.display.phylogeny.newick; },
      set(newick) { this.$store.commit('setPhylogenyNewick', { phylogeny: this.$store.state.ui.display.phylogeny, newick }); },
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
<style scoped>

</style>
