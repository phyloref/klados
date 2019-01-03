<template>
  <div>
    <!-- Add a warning if this phylogeny has changed -->
    <div
      v-if="!isEqualJSON(selectedPhylogeny, testcaseAsLoaded.phylogenies[selectedPhylogenyIndex])"
      class="panel panel-warning"
    >
      <div class="panel-heading">
        Warning!
      </div>
      <div class="panel-body">
        This phylogeny has been modified since being loaded! Use 'Save as JSON' to save your changes.
      </div>
    </div>

    <div
      id="phylogeny-metadata"
      class="form-horizontal"
    >
      <div class="panel panel-info">
        <div class="panel-heading">
          Phylogeny information
        </div>
        <div class="panel-body">
          <label
            for="title"
            class="col-md-2 control-label"
          >
            Title
          </label>
          <div class="col-md-10 input-group">
            <input
              id="title"
              v-model.trim="selectedPhylogeny.title"
              type="text"
              class="form-control"
              placeholder="Enter phylogeny title"
            >
          </div>

          <label
            for="description"
            class="col-md-2 control-label"
          >
            Description
          </label>
          <div class="col-md-10 input-group">
            <textarea
              id="description"
              v-model.trim="selectedPhylogeny.description"
              class="form-control"
              placeholder="Enter phylogeny description"
            />
          </div>

          <label
            for="newick"
            class="col-md-2 control-label"
          >
            Newick
          </label>
          <div class="col-md-10 input-group">
            <textarea
              v-model.lazy="selectedPhylogeny.newick"
              rows="5"
              class="form-control"
              placeholder="Enter Newick string for phylogeny here"
            >{{ getPhylogenyAsNewick('#phylogeny-svg-' + selectedPhylogenyIndex, selectedPhylogeny) }}</textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Display the list of errors encountered when parsing this Newick string -->
    <div
      v-if="getPhylogenyParsingErrors(selectedPhylogeny).length !== 0"
      class="panel panel-warning"
    >
      <div class="panel-heading">
        Errors occurred while parsing Newick string
      </div>
      <div class="panel-body">
        <template v-for="(error, errorIndex) of getPhylogenyParsingErrors(selectedPhylogeny)">
          <p><strong>{{ error.title }}.</strong> {{ error.message }}</p>
        </template>
      </div>
    </div>

    <!-- Display the phylogeny (unless there were Newick parsing errors) -->
    <div
      v-if="getPhylogenyParsingErrors(selectedPhylogeny).length === 0"
      class="panel panel-info"
    >
      <div class="panel-heading">
        Phylogeny visualization
      </div>
      <div class="panel-body">
        <svg
          :id="'phylogeny-svg-' + selectedPhylogenyIndex"
          width="100%"
          :alt="getPhylogenyAsNewick('#phylogeny-svg-' + selectedPhylogenyIndex, selectedPhylogeny)"
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
              Vertical spacing: {{ getPhylogenySpacingX(selectedPhylogenyIndex) }}px <span class="caret" />
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
              Horizontal spacing: {{ getPhylogenySpacingY(selectedPhylogenyIndex) }}px <span class="caret" />
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
            @click="confirm('Are you sure you want to permanently delete this phylogeny?', () => testcase.phylogenies.splice(selectedPhylogenyIndex, 1))"
          >
            Delete phylogeny
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectedPhylogenyView',
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
