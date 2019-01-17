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
          {{ currentPhyx.title || 'Untitled Phyx file' }}
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="promptAndSetDict('Please enter the new title for this Phyx file', currentPhyx, 'title')"
        >
          Edit title
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
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          :class="{active: !selectedPhyloref && !selectedPhylogeny}"
          @click="$store.commit('changeDisplay', {})"
        >
          <em>Summary</em>
        </a>
        <template v-for="(phyloref, phylorefIndex) of phylorefs">
          <a
            href="javascript: void(0)"
            class="list-group-item list-group-item-action"
            :class="{active: selectedPhyloref === phyloref}"
            @click="$store.commit('changeDisplay', {phyloref})"
          >
            <span v-if="phyloref.label">
              {{phyloref.label}}
            </span>
            <span v-else>
              {{ 'Phyloreference ' + (phylorefIndex + 1) }}
            </span>

            <!-- Add a warning if this phyloreference has changed -->
            <ModifiedIcon
              message="This phyloreference has been modified since being loaded! Use 'Save as JSON' to save your changes."
              :compare="phyloref"
              :compareTo="loadedPhyx.phylorefs[phylorefIndex]"
            />
          </a>

          <!-- Add the following information if this phyloreference is selected -->
          <template v-if="selectedPhyloref === phyloref">
            <a
              v-for="(specifier, specifierIndex) of phyloref.internalSpecifiers"
              href="javascript: void(0)"
              class="list-group-item list-group-item-action"
              :class="{active: selectedSpecifier === specifier}"
              @click="$store.commit('changeDisplay', { phyloref, specifier })"
            >
              &#9679; <strong>Internal:</strong> <SpecifierLabel :specifier="specifier" />
            </a>

            <a
              v-for="(specifier, specifierIndex) of phyloref.externalSpecifiers"
              href="javascript: void(0)"
              class="list-group-item list-group-item-action"
              :class="{active: selectedSpecifier === specifier}"
              @click="$store.commit('changeDisplay', { phyloref, specifier })"
            >
              &#9679; <strong>External:</strong> <SpecifierLabel :specifier="specifier" />
            </a>

            <!-- Display phylogenies -->
            <a
              v-for="(phylogeny, phylogenyIndex) of phylogenies"
              class="list-group-item list-group-item-action"
              :class="{active: selectedPhylogeny === phylogeny}"
              href="javascript: void(0)"
              @click="$store.commit('changeDisplay', {phyloref, phylogeny})"
            >
              &#9679; <strong>Phylogeny:</strong>
              <!--
              <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length < 1">
                no expected node
              </template>
              <template v-else>
                node expected
              </template>-->
              in {{ phylogeny.label || `Phylogeny ${phylogenyIndex}` }}
            </a>
          </template>
        </template>

        <!-- Let users add phyloreferences directly from the sidebar -->
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="$store.commit('createEmptyPhyloref')"
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
          @click="$store.commit('changeDisplay', {phylogeny})"
        >
          {{ phylogeny.description || 'Phylogeny ' + (phylogenyIndex + 1) }}

          <!-- Add a warning if this phylogeny has changed -->
          <ModifiedIcon
            message="This phylogeny has been modified since being loaded! Use 'Save as JSON' to save your changes."
            :compare="phylogeny"
            :compareTo="loadedPhyx.phylogenies[phylogenyIndex]"
          />
        </a>
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="$store.commit('createEmptyPhylogeny')"
        >
          <em>Add phylogeny</em>
        </a>
      </div>
    </div>
  </div><!-- End of sidebar -->
</template>

<script>
import Vue from 'vue';
import { mapState, mapGetters } from 'vuex';

import SpecifierLabel from '../phyloref/SpecifierLabel.vue';
import ModifiedIcon from '../icons/ModifiedIcon.vue';

export default {
  name: 'Sidebar',
  components: {
    ModifiedIcon,
    SpecifierLabel,
  },
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
    ...mapGetters([
      'phyxTitle',
    ]),
    ...mapState({
      phyx: state => state.phyx,
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      phylorefs: state => state.phyx.currentPhyx.phylorefs,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
      selectedPhyloref: state => state.ui.display.phyloref,
      selectedPhylogeny: state => state.ui.display.phylogeny,
      selectedSpecifier: state => state.ui.display.selectedSpecifier,
    }),
  },
  methods: {
    promptAndSetDict(message, dict, key) {
      // Given a dictionary and key, we prompt the user (using window.prompt)
      // to provide a new value for that dictionary and key. If one is provided,
      // we replace it.
      const response = window.prompt(message, dict[key]);
      if (response !== undefined && response !== null)
        Vue.set(dict, key, response);
    },

    loadPhyxFromURL(url) {
      // Change the current PHYX to that in the provided URL.
      // Will ask the user to confirm before replacing it.

      $.getJSON(url)
        .done((data) => {
          this.$store.commit('setCurrentPhyx', data);
          this.$store.commit('setLoadedPhyx', data);
          // Reset the display.
          this.$store.commit('changeDisplay', {});
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