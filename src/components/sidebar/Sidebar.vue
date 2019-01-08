<template>
  <!-- Sidebar showing phyloreferences and phylogenies -->
  <div id="sidebar-wrapper">
    <!-- Sidebar section: information about this particular PHYX file -->
    <div class="card bg-dark">
      <div class="list-group list-group-flush">
        <a
          class="list-group-item list-group-item-action bg-dark text-light disabled"
          href="javascript: void(0)"
        >
          <template v-if="phyx.title">
            {{ phyx.title }}
          </template>
          <template v-else>
            Untitled PHYX file
          </template>
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
        >
          Edit title
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="selectedPhyloref = undefined; selectedSpecifier = undefined; selectedPhylogeny = undefined"
        >
          Display summary
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          onclick="$('#file-input').trigger('click')"
        >
          Read from local JSON file
        </a>
        <input
          id="file-input"
          type="file"
          class="d-none"
          @change="loadPhyxFromFileInputById('#file-input')"
        >
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="downloadAsJSON()"
        >
          Save as JSON
        </a>
        <a
          class="list-group-item list-group-item-action start-reasoning"
          href="javascript: void(0)"
          @click="reasonOverPhyloreferences()"
        >
          Reason
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          onclick="$('.phyx-examples').toggleClass('d-none')"
        >
          Examples
        </a>
        <a
          v-for="example of examplePHYXURLs"
          href="javascript: void(0)"
          class="list-group-item list-group-item-action phyx-examples d-none"
          @click="loadPhyxFromURL(example.url)"
        >
          &#9679; {{ example.title }}
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          onclick="$('#advanced-options').modal()"
        >
          Advanced
        </a>
      </div>
    </div>

    <!-- Sidebar section: list of phyloreferences in PHYX file -->
    <div class="card mt-2 bg-dark">
      <!-- List of phyloreferences -->
      <div class="list-group list-group-flush">
        <a
          href="javascript: void(0)"
          class="list-group-item list-group-item-action bg-dark text-light disabled"
        >
          Phyloreferences
        </a>
        <template v-for="(phyloref, phylorefIndex) of phylorefs">
          <a
            href="javascript: void(0)"
            class="list-group-item list-group-item-action"
            :class="{active: selectedPhyloref === phyloref}"
            @click="resetSVG(); selectedPhyloref = phyloref; selectedSpecifier = undefined; selectedPhylogeny = undefined"
          >
            {{ hasProperty(phyloref, 'label') ? phyloref.label : 'Phyloreference ' + (phylorefIndex + 1) }}

            <!-- Add a warning if this phyloreference has changed -->
            <span
              v-if="!isEqualJSON(phyloref, phyxAsLoaded.phylorefs[phylorefIndex])"
              data-toggle="tooltip"
              data-placement="bottom"
              title="This phyloreference has been modified since being loaded! Use 'Save as JSON' to save your changes."
              class="close glyphicon glyphicon-warning-sign"
            />
          </a>
        </template>

        <!-- Add the following information if this phyloreference is selected -->
        <template v-if="selectedPhyloref === phyloref">
          <!-- Display internal specifiers
          <a
            v-for="(internalSpecifier, internalSpecifierIndex) of phyloref.internalSpecifiers"
            href="javascript: void(0)"
            class="list-group-item list-group-item-action"
            :class="{active: selectedSpecifier === internalSpecifier}"
            @click="resetSVG(); selectedPhyloref = phyloref; selectedSpecifier = internalSpecifier; selectedTUnit = undefined; selectedPhylogeny = undefined"
          >
            &#9679; <strong>Internal:</strong> <span v-html="getSpecifierLabelAsHTML(internalSpecifier)" />
          </a> -->

          <!-- Display external specifiers
          <a
            v-for="(externalSpecifier, externalSpecifierIndex) of phyloref.externalSpecifiers"
            href="javascript: void(0)"
            class="list-group-item list-group-item-action"
            :class="{active: selectedSpecifier === externalSpecifier}"
            @click="resetSVG(); selectedPhyloref = phyloref; selectedSpecifier = externalSpecifier; selectedTUnit = undefined; selectedPhylogeny = undefined"
          >
            &#9679; <strong>External:</strong> <span v-html="getSpecifierLabelAsHTML(externalSpecifier)" />
          </a> -->

          <!-- Display phylogenies -->
          <a
            v-for="(phylogeny, phylogenyIndex) of phylogenies"
            class="list-group-item list-group-item-action"
            :class="{active: selectedPhylogeny === phylogeny}"
            href="javascript: void(0)"
            @click="resetSVG(); selectedPhyloref = phyloref; selectedSpecifier = undefined; selectedTUnit = undefined; selectedPhylogeny = phylogeny"
          >
            &#9679; <strong>Phylogeny:</strong>
            <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length < 1">
              no expected node
            </template>
            <template v-else>
              node expected
            </template>
            in {{ getPhylogenyLabel(phylogeny) }}
          </a>
        </template>

        <!-- Let users add phyloreferences directly from the sidebar -->
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="phylorefs.push(createEmptyPhyloref(phylorefs.length + 1))"
        >
          <em>Add phyloreference</em>
        </a>
      </div>
    </div>

    <!-- Sidebar section: list of phylogenies in PHYX file -->
    <div class="card mt-2 bg-dark">
      <div class="list-group list-group-flush">
        <a
          href="javascript: void(0)"
          class="list-group-item list-group-item-action bg-dark text-light disabled"
        >
          Phylogenies
        </a>
        <a
          v-for="(phylogeny, phylogenyIndex) of phylogenies"
          href="javascript: void(0)"
          class="list-group-item list-group-item-action"
          :class="{active: selectedPhylogeny === phylogeny}"
          @click="resetSVG(); selectedPhyloref = undefined; selectedSpecifier = undefined; selectedPhylogeny = phylogeny"
        >
          {{ hasProperty(phylogeny, 'description') ? phylogeny.description : 'Phylogeny ' + (phylogenyIndex + 1) }}

          <!-- Add a warning if this phylogeny has changed -->
          <span
            v-if="!isEqualJSON(phylogeny, phyxAsLoaded.phylogenies[phylogenyIndex])"
            data-toggle="tooltip"
            data-placement="bottom"
            title="This phylogeny has been modified since being loaded! Use 'Save as JSON' to save your changes."
            class="close glyphicon glyphicon-warning-sign"
          />
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="phylogenies.push({})"
        >
          <em>Add phylogeny</em>
        </a>
      </div>
    </div>
  </div><!-- End of sidebar -->
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Sidebar',
  computed: {
    examplePHYXURLs() {
      return [
        {
          url: 'examples/fisher_et_al_2007.json',
          title: 'Fisher et al, 2007',
        },
        {
          url: 'examples/hillis_and_wilcox_2005.json',
          title: 'Hillis and Wilcox, 2005',
        },
        {
          url: 'examples/brochu_2003.json',
          title: 'Brochu 2003',
        },
      ];
    },
    ...mapState({
      phyx: state => state.phyx,
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      phylorefs: state => state.phyx.currentPhyx.phylorefs,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
      selectedPhyloref: state => state.ui.display.phyloref,
      selectedPhylogeny: state => state.ui.display.phylogeny,
      selectedSpecifier: state => state.ui.display.internalSpecifier,
    }),
  },
  methods: {
    loadPhyxFromFileInputById(id) {

    },

    loadPhyxFromURL(url) {
      // Change the current PHYX to that in the provided URL.
      // Will ask the user to confirm before replacing it.

      $.getJSON(url)
        .done((data) => {
          this.$store.commit('setCurrentPhyx', data);
          this.$store.commit('setLoadedPhyx', data);
        })
        .fail((error) => {
          if (error.status === 200) {
            alert(`Could not load PHYX file '${url}': file malformed, see console for details.`);
          } else {
            alert(`Could not load PHYX file '${url}': server error ${error.status} ${error.statusText}`);
          }
          // throw new Error(`Could not load PHYX file ${url}: ${error}`);
        });
    },
  },
};
</script>
