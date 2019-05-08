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
          <span v-if="reasoningInProgress">
            (Reasoning in progress)
          </span>
          <span v-else>
            Reason
          </span>
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
            class="h6 list-group-item list-group-item-action border-dark"
            :class="{active: selectedPhyloref === phyloref}"
            @click="$store.commit('changeDisplay', {phyloref})"
          >
            <span v-if="phyloref.label">
              {{ phyloref.label }}
            </span>
            <span v-else>
              {{ 'Phyloreference ' + (phylorefIndex + 1) }}
            </span>

            <!-- Add a warning if this phyloreference has changed -->
            <ModifiedIcon
              message="This phyloreference has been modified since being loaded! Use 'Save as JSON' to save your changes."
              :compare="phyloref"
              :compare-to="loadedPhyx.phylorefs[phylorefIndex]"
            />
          </a>

          <!-- Add the following information if this phyloreference is selected -->
          <template v-if="selectedPhyloref === phyloref">
            <a
              v-for="(specifier, specifierIndex) of phyloref.internalSpecifiers"
              href="javascript: void(0)"
              class="list-group-item list-group-item-action"
              :class="{'active border-dark': selectedSpecifier === specifier}"
              @click="$store.commit('changeDisplay', { phyloref, specifier })"
            >
              &#9679; <strong>Internal:</strong> {{ getSpecifierLabel(specifier) }}
            </a>

            <a
              v-for="(specifier, specifierIndex) of phyloref.externalSpecifiers"
              href="javascript: void(0)"
              class="list-group-item list-group-item-action"
              :class="{'active border-dark': selectedSpecifier === specifier}"
              @click="$store.commit('changeDisplay', { phyloref, specifier })"
            >
              &#9679; <strong>External:</strong> {{ getSpecifierLabel(specifier) }}
            </a>
            <a
              href="javascript: void(0)"
              class="list-group-item list-group-item-action"
              @click="$store.commit('addSpecifier', { phyloref })"
            >
              &#9679; <em>Add specifier</em>
            </a>
          </template>
        </template>

        <!-- Let users add phyloreferences directly from the sidebar -->
        <a
          class="list-group-item list-group-item-action border-dark"
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
          class="list-group-item list-group-item-action border-dark"
          :class="{active: selectedPhylogeny === phylogeny}"
          @click="$store.commit('changeDisplay', {phylogeny})"
        >
          {{ phylogeny.label || `Phylogeny ${phylogenyIndex + 1}` }}

          <!-- Add a warning if this phylogeny has changed -->
          <ModifiedIcon
            message="This phylogeny has been modified since being loaded! Use 'Save as JSON' to save your changes."
            :compare="phylogeny"
            :compare-to="loadedPhyx.phylogenies[phylogenyIndex]"
          />
        </a>
        <a
          class="list-group-item list-group-item-action border-dark"
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
/*
 * Creates the sidebar that displays:
 *  - Menu items (save, load, reason)
 *  - A list of all phyloreferences and a button to add more phylorefs.
 *  - A list of all phylogenies and a button to add more phylogenies.
 */

import Vue from 'vue';
import { has } from 'lodash';
import { mapState, mapGetters } from 'vuex';
import { saveAs } from 'filesaver.js-npm';

import { PHYXWrapper, PhylorefWrapper } from '@phyloref/phyx';

import ModifiedIcon from '../icons/ModifiedIcon.vue';

export default {
  name: 'Sidebar',
  components: {
    ModifiedIcon,
  },
  data() {
    return {
      reasoningInProgress: false, // Set when reasoning is in progress.
    };
  },
  computed: {
    examplePHYXURLs() {
      // Returns a list of example files to display in the "Examples" menu.
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
      selectedSpecifier: state => state.ui.display.specifier,
    }),
  },
  methods: {
    getSpecifierLabel(specifier) {
      // Get the label for a particular specifier.
      // TODO: We need to include verbatimSpecifier first because of
      // https://github.com/phyloref/phyx.js/issues/14
      return specifier.verbatimSpecifier || PhylorefWrapper.getSpecifierLabel(specifier) || 'Undefined specifier';
    },

    promptAndSetDict(message, dict, key) {
      // Given a dictionary and key, we prompt the user (using window.prompt)
      // to provide a new value for that dictionary and key. If one is provided,
      // we replace it.
      const response = window.prompt(message, dict[key]);
      if (response !== undefined && response !== null) Vue.set(dict, key, response);
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

    loadPhyxFromFileInputById(fileInputId) {
      //
      // Load a JSON file from the local file system using FileReader. fileInput
      // needs to be an HTML element representing an <input type="file"> in which
      // the user has selected the local file they wish to load.
      //
      // This code is based on https://stackoverflow.com/a/21446426/27310

      if (typeof window.FileReader !== 'function') {
        alert('The FileReader API is not supported on this browser.');
        return;
      }

      const $fileInput = $(fileInputId);
      if (!$fileInput) {
        alert('Programmer error: No file input element specified.');
        return;
      }

      if (!$fileInput.prop('files')) {
        alert('File input element found, but files property missing: try another browser?');
        return;
      }

      if (!$fileInput.prop('files')[0]) {
        alert('Please select a file before attempting to load it.');
        return;
      }

      const [file] = $fileInput.prop('files');
      const fr = new FileReader();
      fr.onload = ((e) => {
        const lines = e.target.result;
        const phyx = JSON.parse(lines);

        this.$store.commit('setCurrentPhyx', phyx);
        this.$store.commit('setLoadedPhyx', phyx);

        // Reset the display.
        this.$store.commit('changeDisplay', {});
      });
      fr.readAsText(file);
    },

    downloadAsJSON() {
      // Provide the JSON file as a download to the browser.
      const content = [this.$store.getters.getPhyxAsJSON];

      // Save to local hard drive.
      const jsonFile = new File(content, 'download.json', { type: 'application/json;charset=utf-8' });
      saveAs(jsonFile);

      // saveAs(jsonFile) doesn't report on whether the user acceped the download
      // or not. We assume, possibly incorrectly, that they did and that the
      // current JSON content has been saved. We therefore reset testcaseAsLoaded
      // so we can watch for other changes.
      //
      // A more sophisticated API like https://github.com/jimmywarting/StreamSaver.js
      // might be able to let us know if the file was saved correctly.
      //
      // Deep-copy the testcase into a 'testcaseAsLoaded' variable in our
      // model. We deep-compare this.testcase with this.testcaseAsLoaded to
      // determine if the loaded model has been modified.
      this.$store.commit('setLoadedPhyx');
    },

    reasonOverPhyloreferences() {
      // Reason over all the phyloreferences and store the results on
      // the Vue model at vm.reasoningResults so we can access them.

      // Are we already reasoning? If so, ignore.
      if (this.reasoningInProgress) return;

      // Disable "Reason" buttons so they can't be reused.
      this.reasoningInProgress = true;
      $.post('http://localhost:34214/reason', {
        // This will convert the JSON-LD file into an application/x-www-form-urlencoded
        // string (see https://api.jquery.com/jquery.ajax/#jQuery-ajax-settings under
        // processData for details). The POST data sent to the server will look like:
        //  jsonld=%7B%5B%7B%22title%22%3A...
        // which translates to:
        //  jsonld={[{"title":...
        jsonld: JSON.stringify([new PHYXWrapper(
          this.$store.state.phyx.currentPhyx,
          d3.layout.newick_parser,
        )
          .asJSONLD()], undefined, 4),
      }).done((data) => {
        this.$store.commit('setReasoningResults', data);
        // console.log('Data retrieved: ', data);
      }).fail((jqXHR, textStatus, errorThrown) => {
        // We can try using the third argument, but it appears to be the
        // HTTP status (e.g. 'Internal Server Error'). So we default to that,
        // but look for a better one in the JSON response from the server, if
        // available.
        let error = errorThrown;
        if (has(jqXHR, 'responseJSON') && has(jqXHR.responseJSON, 'error')) {
          error = jqXHR.responseJSON.error;
        }

        if (error === undefined || error === '') error = 'unknown error';
        alert(`Error occurred on server while reasoning: ${error}`);
      }).always(() => {
        // Reset "Reasoning" buttons to their usual state.
        this.reasoningInProgress = false;
      });
    },
  },
};
</script>
