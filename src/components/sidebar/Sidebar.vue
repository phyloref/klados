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
          Actions
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
          onclick="$('.phyx-examples').toggleClass('d-none')"
        >
          Read an example file
        </a>

        <a
          v-for="example of examplePHYXURLs"
          href="javascript: void(0)"
          class="list-group-item list-group-item-action phyx-examples d-none small"
          @click="loadPhyxFromURL(example.url)"
        >
          &#9679; {{ example.title }}
        </a>
        <a
          class="list-group-item list-group-item-action phyx-examples d-none small"
          href="javascript: void(0)"
          onclick="$('.phyx-examples').toggleClass('d-none')"
        >
          <em>Close list of examples</em>
        </a>

        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="downloadAsJSON()"
        >
          Save
          <ModifiedIcon
            message="This Phyx file has been modified after it was loaded! Use 'Save' to save your changes."
            :compare="currentPhyx"
            :compare-to="loadedPhyx"
          />
        </a>

        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="downloadAsJSONLD()"
        >
          Export as JSON-LD
        </a>

        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="downloadAsNQuads()"
        >
          Export as ontology
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
            Resolve against phylogenies
          </span>
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
              message="This phyloreference has been modified after it was loaded! Use 'Save' to save your changes."
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
          class="h6 list-group-item list-group-item-action border-dark"
          :class="{active: selectedPhylogeny === phylogeny}"
          @click="$store.commit('changeDisplay', {phylogeny})"
        >
          {{ phylogeny.label || `Phylogeny ${phylogenyIndex + 1}` }}

          <!-- Add a warning if this phylogeny has changed -->
          <ModifiedIcon
            message="This phylogeny has been modified after it was loaded! Use 'Save' to save your changes."
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
        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="$store.dispatch('createPhylogenyFromOpenTree')"
        >
          <em>Add Open Tree of Life phylogeny</em>
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
import { saveAs } from 'file-saver';
import { signer } from 'x-hub-signature';
import zlib from 'zlib';

import { PhyxWrapper, PhylorefWrapper, TaxonomicUnitWrapper } from '@phyloref/phyx';

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
    downloadFilenameForPhyx() {
      // Return a filename to be used to name downloads of this Phyx document.

      // The default download filename to use if no phylorefs are present.
      const DEFAULT_DOWNLOAD_FILENAME = 'download';

      if (!this.currentPhyx || !this.phylorefs) {
        return DEFAULT_DOWNLOAD_FILENAME;
      }

      // Determine all phyloref labels in this document. Non-Latin characters will be replaced with '_' to avoid
      // creating filenames using non-ASCII Unicode characters. As per the UI, unlabeled phylorefs will be referred
      // to as 'Phyloref 1', 'Phyloref 2', and so on.
      const phylorefLabels = this.phylorefs.map((p, index) => (has(p, 'label') ? p.label.replaceAll(/\W/g, '_') : `Phyloref_${index + 1}`));

      // Construct a download filename depending on the number of phylorefs, which is in the form:
      // - Phyloref_1
      // - Phyloref_1_and_Phyloref_2
      // - Phyloref_1_Phyloref_2_and_Phyloref_3
      // - Phyloref_1_Phyloref_2_and_2_others
      // - ...
      if (phylorefLabels.length === 0) return DEFAULT_DOWNLOAD_FILENAME;
      if (phylorefLabels.length === 1) return phylorefLabels[0];
      if (phylorefLabels.length === 2) return `${phylorefLabels[0]}_and_${phylorefLabels[1]}`;
      if (phylorefLabels.length === 3) return `${phylorefLabels[0]}_${phylorefLabels[1]}_and_${phylorefLabels[2]}`;
      return `${phylorefLabels[0]}_${phylorefLabels[1]}_and_${phylorefLabels.length - 2}_others`;
    },
    examplePHYXURLs() {
      // Returns a list of example files to display in the "Examples" menu.
      return [
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
      return specifier.verbatimSpecifier || new TaxonomicUnitWrapper(specifier).label || 'Undefined specifier';
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

      // Is the user sure that they want to do this?
      if(this.$store.getters.loadedPhyxChanged) {
        if(!confirm('The current Phyx file has been modified! Are you sure you want to discard these changes by loading another file?')) {
          return;
        }
      }

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

      // Is the user sure that they want to do this?
      if(this.$store.getters.loadedPhyxChanged) {
        if(!confirm('The current Phyx file has been modified! Are you sure you want to discard these changes by loading another file?')) {
          return;
        }
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
      const content = [JSON.stringify(this.$store.state.phyx.currentPhyx, undefined, 4)];

      // Save to local hard drive.
      const jsonFile = new File(content, `${this.downloadFilenameForPhyx}.json`, { type: 'application/json;charset=utf-8' });
      saveAs(jsonFile, `${this.downloadFilenameForPhyx}.json`);

      // saveAs(jsonFile) doesn't report on whether the user accepted the download
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

    downloadAsJSONLD() {
      // Exports the PHYX file as an OWL/JSON-LD file, which can be opened in
      // Protege or converted into OWL/XML or other formats.
      const wrapped = new PhyxWrapper(this.$store.state.phyx.currentPhyx);
      const content = [JSON.stringify([wrapped.asJSONLD()], undefined, 4)];

      // Save to local hard drive.
      const jsonldFile = new File(content, `${this.downloadFilenameForPhyx}.jsonld`, { type: 'application/json;charset=utf-8' });
      saveAs(jsonldFile, `${this.downloadFilenameForPhyx}.jsonld`);
    },

    downloadAsNQuads() {
      // Exports the PHYX file as an OWL/N-Quads file, which can be opened in
      // Protege or converted into other RDF formats.
      const wrapped = new PhyxWrapper(this.$store.state.phyx.currentPhyx);

      // TODO: we need a baseIRI here because of https://github.com/phyloref/phyx.js/issues/113
      // Once that is fixed in phyx.js, we can remove it here.
      wrapped.toRDF('https://example.phyloref.org/phyx#').then((content) => {
        // Save to local hard drive.
        const nqFile = new File([content], `${this.downloadFilenameForPhyx}.owl`, { type: 'application/n-quads;charset=utf-8' });
        saveAs(nqFile, `${this.downloadFilenameForPhyx}.owl`);
      });
    },

    reasonOverPhyloreferences() {
      // Reason over all the phyloreferences and store the results on
      // the Vue model at vm.reasoningResults so we can access them.

      // Are we already reasoning? If so, ignore.
      if (this.reasoningInProgress) return;

      // Reset the existing reasoning information.
      this.$store.commit('setReasoningResults', undefined);

      // Disable "Reason" buttons so they can't be reused.
      this.reasoningInProgress = true;

      // Make sure that the Reason button is updated before we convert the Phyx
      // file into JSON-LD.
      const outerThis = this;
      Vue.nextTick(function () {
        // Prepare JSON-LD file for submission.
        const jsonld = JSON.stringify([new PhyxWrapper(
          outerThis.$store.state.phyx.currentPhyx,
          d3.layout.newick_parser,
        ).asJSONLD()]);

        // To improve upload speed, let's Gzip the file before upload.
        const jsonldGzipped = zlib.gzipSync(jsonld);

        // Prepare request for submission.
        const query = $.param({
          // Convert Gzipped data into a string in Base64.
          jsonldGzipped: Buffer.from(jsonldGzipped).toString('base64')
        }).replace(/%20/g, '+');  // $.post will do this automatically,
                                  // but we need to do this here so our
                                  // signature works.

        // Sign it with an X-Hub-Signature.
        const sign = signer({
            algorithm: 'sha1',
            secret: outerThis.$config.JPHYLOREF_X_HUB_SIGNATURE_SECRET,
        });
        const signature = sign(new Buffer(query));

        console.log('Query: ', query);
        console.log('Signature: ', signature);

        $.post({
          url: outerThis.$config.JPHYLOREF_SUBMISSION_URL,
          data: query,
          headers: {
            'X-Hub-Signature': signature,
          },
        }).done((data) => {
          outerThis.$store.commit('setReasoningResults', data);
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
          outerThis.reasoningInProgress = false;
        });
      });
    },
  },
};
</script>
