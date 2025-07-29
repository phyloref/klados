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
        />

        <a
          class="list-group-item list-group-item-action"
          href="javascript: void(0)"
          onclick="$('#file-input-concat').trigger('click')"
        >
          Concatenate local JSON file
        </a>
        <input
          id="file-input-concat"
          type="file"
          class="d-none"
          @change="concatPhyxFromFileInputById('#file-input-concat')"
        />

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
          class="m-0 border-0 list-group-item list-group-item-action bg-dark text-light disabled"
        >
          Phyloreferences
        </a>
        <a
          class="m-0 border-0 list-group-item list-group-item-action"
          href="javascript: void(0)"
          :class="{active: !selectedPhyloref && !selectedPhylogeny}"
          @click="$store.commit('changeDisplay', {})"
        >
          <em>Summary</em>
        </a>
        <template v-for="(phyloref, phylorefIndex) of phylorefs">
          <a
            href="javascript: void(0)"
            class="h6 border-top border-bottom-0 m-0 border-dark list-group-item list-group-item-action"
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
            >
              &#9679; <strong>Internal:</strong> {{ getSpecifierLabel(specifier) }}
            </a>

            <a
              v-for="(specifier, specifierIndex) of phyloref.externalSpecifiers"
              href="javascript: void(0)"
              class="list-group-item list-group-item-action"
            >
              &#9679; <strong>External:</strong> {{ getSpecifierLabel(specifier) }}
            </a>
          </template>
        </template>

        <!-- Let users add phyloreferences directly from the sidebar -->
        <a
          class="border-top border-dark list-group-item list-group-item-action"
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
          class="by-1 m-0 list-group-item list-group-item-action bg-dark text-light disabled"
        >
          Phylogenies
        </a>
        <a
          v-for="(phylogeny, phylogenyIndex) of phylogenies"
          href="javascript: void(0)"
          class="h6 border-top m-0 list-group-item list-group-item-action"
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
          class="border-dark border-top border-bottom-0 list-group-item list-group-item-action"
          href="javascript: void(0)"
          @click="$store.commit('createEmptyPhylogeny')"
        >
          <em>Add phylogeny</em>
        </a>
        <a
          class="border-dark border-top border-bottom-0 list-group-item list-group-item-action"
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
import { cloneDeep, has } from 'lodash';
import { Buffer } from "buffer";
import { newickParser } from "phylotree";
import { mapState, mapGetters } from 'vuex';
import { saveAs } from 'filesaver.js-npm';
import CryptoJS from 'crypto-js';
import pako from 'pako';
import {
  JPHYLOREF_X_HUB_SIGNATURE_SECRET,
  JPHYLOREF_SUBMISSION_URL,
} from '@/config';

import { PhyxWrapper, PhylorefWrapper, TaxonomicUnitWrapper, TaxonNameWrapper } from "@phyloref/phyx";

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
      return this.$store.getters.getDownloadFilenameForPhyx;
    },
    examplePHYXURLs() {
      // Returns a list of example files to display in the "Examples" menu.
      return [
        {
          url: 'examples/brochu_2003.json',
          title: 'Brochu 2003',
        },
        {
          url: 'examples/fisher_et_al_2007.json',
          title: 'Fisher et al, 2007',
        },
        {
          url: "examples/testudinata_phylonym.json",
          title: "Testudinata from Phylonym",
        },
      ];
    },
    wrappedPhyx() {
      return new PhyxWrapper(
        this.$store.state.phyx.currentPhyx,
        newickParser
      );
    },
    wrappedPhyxAsJSONLD() {
      try {
        return this.wrappedPhyx.asJSONLD();
      } catch (err) {
        alert(`Could not convert phylogeny to ontology: ${err}`);
        throw err;
      }
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
      if (this.$store.getters.loadedPhyxChanged) {
        if (!confirm('The current Phyx file has been modified! Are you sure you want to discard these changes by loading another file?')) {
          return;
        }
      }

      $.getJSON(url)
        .done((data) => {
          // TODO: validate that `data` is a Phyx file.

          // Klados tends to fail in odd ways unless both the `phylorefs` and `phylogenies` keys are present in the
          // input data, so let's add them if they're missing.
          if (!has(data, 'phylorefs')) data.phylorefs = [];
          if (!has(data, 'phylogenies')) data.phylogenies = [];

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
      if (this.$store.getters.loadedPhyxChanged) {
        if (!confirm('The current Phyx file has been modified! Are you sure you want to discard these changes by loading another file?')) {
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

    concatPhyxFromFileInputById(fileInputId) {
      //
      // Concatenate a JSON file from the local file system using FileReader. fileInput
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

      // Let's copy the current Phyx document so that we can modify it without modifying the original.
      const outerStore = this.$store;
      const currentPhyx = cloneDeep(outerStore.state.phyx.currentPhyx);

      // Load the new Phyx document that we need to concatenate into currentPhyx.
      const [file] = $fileInput.prop('files');
      const fr = new FileReader();
      fr.onload = ((e) => {
        // Load the newPhyx document as a JSON object.
        const lines = e.target.result;
        const newPhyx = JSON.parse(lines);

        // Before we do anything else, lets check if the two Phyx files have
        // different nomenclatural codes.
        const currentNomenclaturalCode = currentPhyx['defaultNomenclaturalCodeIRI'];
        const newNomenclaturalCode = newPhyx['defaultNomenclaturalCodeIRI'];

        if (currentNomenclaturalCode && newNomenclaturalCode && currentNomenclaturalCode !== newNomenclaturalCode) {
          const currentNomenInfo = TaxonNameWrapper.getNomenCodeDetails(currentNomenclaturalCode);
          const newNomenInfo = TaxonNameWrapper.getNomenCodeDetails(newNomenclaturalCode);

          if (!window.confirm(
            'The Phyx file you are concatenating has a different default nomenclatural code (' +
            (newNomenInfo['title'] || newNomenclaturalCode) +
            `) than the current Phyx file (${currentNomenInfo['title'] || currentNomenclaturalCode}). ` +
            'Are you sure you wish to concatenate them?'
          )) return;
        }

        // We don't need to fully combine the two Phyx files: just take the
        // phylorefs and the phylogenies from the new file and add them to the
        // current file.
        const phylorefsToAdd = newPhyx.phylorefs || [];
        const phylogeniesToAdd = newPhyx.phylogenies || [];

        // Step 1. Make sure we don't have any phylorefs with the same @id.
        const currentPhylorefIds = (currentPhyx.phylorefs || [])
          .map(phyloref => phyloref['@id'] || outerStore.getters.getPhylorefId(phyloref));
        const phylorefIdsToAdd = phylorefsToAdd.map(phyloref => phyloref['@id']);
        const phylorefIdsInCommon = currentPhylorefIds.filter(phylorefId => phylorefIdsToAdd.includes(phylorefId));
        if (phylorefIdsInCommon.length > 0) {
          alert('Cannot concatenate Phyx files -- the following phyloref IDs are present in the current file: ' + phylorefIdsInCommon.join(', '));
          return;
        }

        // Step 2. Make sure we don't have any phylogenies with the same @id.
        const currentPhylogenyIds = (currentPhyx.phylogenies || [])
          .map(phylogeny => phylogeny['@id'] || outerStore.getters.getPhylogenyId(phylogeny));
        const phylogenyIdsToAdd = phylogeniesToAdd.map(phylogeny => phylogeny['@id']);
        const phylogenyIdsInCommon = currentPhylogenyIds.filter(phylogenyId => phylogenyIdsToAdd.includes(phylogenyId));
        if (phylogenyIdsInCommon.length > 0) {
          alert('Cannot concatenate Phyx files -- the following phylogeny IDs are present in the current file: ' + phylogenyIdsInCommon.join(', '));
          return;
        }

        // Step 3. It's safe to add the phylorefs and phylogenies!
        currentPhyx.phylorefs = (currentPhyx.phylorefs || []).concat(phylorefsToAdd);
        currentPhyx.phylogenies = (currentPhyx.phylogenies || []).concat(phylogeniesToAdd);

        // Step 4. Replace the current Phyx. Note that this leaves the loaded Phyx
        // object unchanged (we can change that using commit `setLoadedPhyx'), so
        // all the "Please save this file" warnings will appear in the UI.
        this.$store.commit('setCurrentPhyx', currentPhyx);

        // Reset the display.
        this.$store.commit('changeDisplay', {});
      });

      // Activate reading the file.
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
      const jsonld = this.wrappedPhyxAsJSONLD;
      if (!jsonld) return;
      const content = [JSON.stringify([jsonld], undefined, 4)];

      // Save to local hard drive.
      const jsonldFile = new File(content, `${this.downloadFilenameForPhyx}.jsonld`, { type: 'application/json;charset=utf-8' });
      saveAs(jsonldFile, `${this.downloadFilenameForPhyx}.jsonld`);
    },

    downloadAsNQuads() {
      // Exports the Phyx file as an OWL/N-Quads file, which can be opened in
      // Protege or converted into other RDF formats.
      //
      // Note that (1) IRIs in n-Quads files can only be written as absolute
      // IRIs (see https://www.w3.org/TR/n-quads/#sec-iri) and (2) Protege
      // cannot load an n-Quads file where phylorefs/phylogeny nodes are
      // expressed as blank nodes, so for maximum downstream reusability, we
      // set a baseIRI of `http://example.org/phyx#`. Any absolute IRIs in the
      // Phyx file will not be transformed.
      //
      // You can see details about
      // this issue at https://github.com/phyloref/klados/issues/231 and
      // https://github.com/phyloref/phyx.js/issues/113
      //
      const wrapped = this.wrappedPhyx;

      try {
        wrapped.toRDF("http://example.org/phyx#").then((content) => {
          // Save to local hard drive.
          const nqFile = new File([content], `${this.downloadFilenameForPhyx}.owl`, {type: 'application/n-quads;charset=utf-8'});
          saveAs(nqFile, `${this.downloadFilenameForPhyx}.owl`);
        });
      } catch (err) {
        alert(`Could not convert phylogeny to ontology: ${err}`);
      }
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

      // Convert to JSONLD for export.
      let jsonld;
      try {
        jsonld = this.wrappedPhyx.asJSONLD();
      } catch (err) {
        alert(`Could not convert phylogeny to ontology: ${err}`);
        this.reasoningInProgress = false;
        return;
      }
      if (!jsonld) {
        this.reasoningInProgress = false;
        return;
      }

      // Make sure that the Reason button is updated before we convert the Phyx
      // file into JSON-LD.
      const outerThis = this;
      Vue.nextTick(() => {
        const jsonldAsStr = JSON.stringify([jsonld]);

        // To improve upload speed, let's Gzip the file before upload.
        const jsonldGzipped = pako.gzip(jsonldAsStr);

        // Prepare request for submission.
        const query = $.param({
          // Convert Gzipped data into a string in Base64.
          jsonldGzipped: Buffer.from(jsonldGzipped).toString('base64'),
        }).replace(/%20/g, '+'); // $.post will do this automatically,
        // but we need to do this here so our
        // signature works.

        // Sign it with an X-Hub-Signature.
        const signature = "sha1=" + CryptoJS.HmacSHA1(query, JPHYLOREF_X_HUB_SIGNATURE_SECRET)
            .toString(CryptoJS.enc.Hex);

        console.log('Query: ', query);
        console.log('Signature: ', signature);

        $.post({
          url: JPHYLOREF_SUBMISSION_URL,
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
