<template>
  <div>
    <!-- Add a warning if this specifier has changed -->
    <ModifiedCard
      message="This specifier has been modified since being loaded! Use 'Save as JSON' to save your changes."
      :compare="selectedSpecifier"
      :compare-to="loadedSpecifier"
    />

    <div class="card">
      <h5 class="card-header">
        Specifier
      </h5>
      <div class="card-body">
        <div class="form-group row">
          <label
            for="specifier-type"
            class="col-form-label col-md-2"
          >
            Specifier type
          </label>
          <div class="col-md-10">
            <select
              id="specifier-type"
              v-model="specifierType"
              class="form-control"
            >
              <option>Internal specifier</option>
              <option>External specifier</option>
            </select>
          </div>
        </div>

        <div class="form-group row">
          <label
            for="verbatim-specifier"
            class="col-form-label col-md-2"
          >
            Verbatim specifier
          </label>
          <div class="col-md-10">
            <input
              id="verbatim-specifier"
              v-model.trim="selectedVerbatimSpecifier"
              type="text"
              class="form-control"
              placeholder="Enter the verbatim description of this specifier"
            >
          </div>
        </div>

        <div class="card mb-2">
          <h6 class="card-header">
            Scientific names
          </h6>
          <div class="card-body">
            <div v-for="(sciname, index) of selectedSpecifierFirstTUnit.scientificNames">
              <div id="sciname">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    :value="sciname.scientificName"
                    @change="$store.commit('setSpecifierPart', { specifierPart: sciname, scientificName: $event.target.value })"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary details"
                      type="button"
                      onclick="$(this).parents().filter('#sciname').find('.details').toggleClass('d-none')"
                    >
                      Show details
                    </button>
                    <button
                      class="btn btn-outline-secondary details d-none"
                      type="button"
                      onclick="$(this).parents().filter('#sciname').find('.details').toggleClass('d-none')"
                    >
                      Hide details
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      type="button"
                      @click="$store.commit('deleteFromSpecifier', {specifier: selectedSpecifierFirstTUnit, scientificName: sciname})"
                    >
                      &cross;
                    </button>
                  </div>
                </div>
                <ul class="details d-none">
                  <li>Scientific name: <em>{{ wrappedScientificName(sciname).scientificName }}</em></li>
                  <li>Genus: <em>{{ wrappedScientificName(sciname).genus }}</em></li>
                  <li>Specific epithet: <em>{{ wrappedScientificName(sciname).specificEpithet }}</em></li>
                </ul>
              </div>
            </div>
            <input
              v-model.lazy="addNewScientificName"
              type="text"
              class="form-control"
              placeholder="Enter a new scientific name here."
            >
          </div>
        </div>

        <div class="card mb-2">
          <h6 class="card-header">
            Specimens
          </h6>
          <div class="card-body">
            <div v-for="(specimen, index) of selectedSpecifierFirstTUnit.includesSpecimens">
              <div id="specimen">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    :value="specimen.occurrenceID"
                    @change="$store.commit('setSpecifierPart', { specifierPart: specimen, occurenceID: $event.target.value })"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary details"
                      type="button"
                      onclick="$(this).parents().filter('#specimen').find('.details').toggleClass('d-none')"
                    >
                      Show details
                    </button>
                    <button
                      class="btn btn-outline-secondary details d-none"
                      type="button"
                      onclick="$(this).parents().filter('#specimen').find('.details').toggleClass('d-none')"
                    >
                      Hide details
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      type="button"
                      @click="$store.commit('deleteFromSpecifier', {specifier: selectedSpecifierFirstTUnit, specimen})"
                    >
                      &cross;
                    </button>
                  </div>
                </div>
                <ul class="details d-none">
                  <li>Occurrence ID: {{ wrappedSpecimen(specimen).occurrenceID }}</li>
                  <li>Institution code: {{ wrappedSpecimen(specimen).institutionCode || '(none)' }}</li>
                  <li>Collection code: {{ wrappedSpecimen(specimen).collectionCode || '(none)' }}</li>
                  <li>Catalog number: {{ wrappedSpecimen(specimen).catalogNumber || '(none)' }}</li>
                </ul>
              </div>
            </div>
            <input
              v-model.lazy="addNewSpecimen"
              type="text"
              class="form-control"
              placeholder="Enter a new specimen identifier here."
            >
          </div>
        </div>

        <div class="card mb-2">
          <h6 class="card-header">
            External references
          </h6>
          <div class="card-body">
            <div
              v-for="(extref) of externalReferences"
              class="input-group"
            >
              <input
                type="text"
                class="form-control"
                :value="extref"
                @change="$store.commit('updateSpecifierExternalReference', { specifier: selectedSpecifierFirstTUnit, fromExternalReference: extref, toExternalReference: $event.target.value })"
              >
              <div class="input-group-append">
                <a
                  class="btn btn-outline-secondary"
                  target="_new"
                  :href="extref"
                >
                  Go to website
                </a>
                <button
                  class="btn btn-outline-danger"
                  type="button"
                  @click="$store.commit('deleteFromSpecifier', {specifier: selectedSpecifierFirstTUnit, externalReference: extref})"
                >
                  &cross;
                </button>
              </div>
            </div>
            <input
              v-model.lazy="addNewExternalReference"
              type="text"
              class="form-control"
              placeholder="Enter a new external reference URI here."
            >
          </div>
        </div>

        <a
          href="javascript: void(0)"
          class="btn btn-secondary mr-2 float-right"
          @click="$store.commit('changeDisplay', { phyloref: selectedPhyloref })"
        >
          Close specifier view
        </a>
        <a
          href="javascript: void(0)"
          class="btn btn-danger"
          @click="$store.commit('deleteSpecifier', { phyloref: selectedPhyloref, specifier: selectedSpecifier })"
        >
          Delete specifier
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { has } from 'lodash';
import { mapState } from 'vuex';
import {
  ScientificNameWrapper,
  SpecimenWrapper,
} from '@phyloref/phyx';
import ModifiedCard from '../cards/ModifiedCard.vue';

export default {
  name: 'SpecifierView',
  components: {
    ModifiedCard,
  },
  computed: {
    loadedSpecifier() {
      // Return the loaded version of this specifier (i.e. the version in loadedPhyx
      // rather than currentPhyx).
      const loadedPhyx = this.loadedPhyx;
      const currentPhyx = this.currentPhyx;
      const loadedPhyloref = loadedPhyx
        .phylorefs[currentPhyx.phylorefs.indexOf(this.selectedPhyloref)];

      if (loadedPhyloref === undefined) return undefined;
      if (
        has(this.selectedPhyloref, 'internalSpecifiers')
        && has(loadedPhyloref, 'internalSpecifiers')
        && this.selectedPhyloref.internalSpecifiers.includes(this.selectedSpecifier)
      ) {
        return loadedPhyloref
          .internalSpecifiers[this.selectedPhyloref
            .internalSpecifiers.indexOf(this.selectedSpecifier)];
      }

      if (
        has(this.selectedPhyloref, 'externalSpecifiers')
        && has(loadedPhyloref, 'externalSpecifiers')
        && this.selectedPhyloref
          .externalSpecifiers.includes(this.selectedSpecifier)
      ) {
        return loadedPhyloref
          .externalSpecifiers[this.selectedPhyloref
            .externalSpecifiers.indexOf(this.selectedSpecifier)];
      }

      return undefined;
    },
    specifierType: {
      // Allow the type of this specifier (internal or external) to be returned or changed.
      get() {
        if (has(this.selectedPhyloref, 'internalSpecifiers') && this.selectedPhyloref.internalSpecifiers.includes(this.selectedSpecifier)) return 'Internal specifier';
        if (has(this.selectedPhyloref, 'externalSpecifiers') && this.selectedPhyloref.externalSpecifiers.includes(this.selectedSpecifier)) return 'External specifier';
        return undefined;
      },
      set(type) {
        if (type === 'Internal specifier') {
          this.$store.commit('setSpecifierType', { phyloref: this.selectedPhyloref, specifier: this.selectedSpecifier, specifierType: 'internal' });
        } else if (type === 'External specifier') {
          this.$store.commit('setSpecifierType', { phyloref: this.selectedPhyloref, specifier: this.selectedSpecifier, specifierType: 'external' });
        } else {
          throw new Error(`Unknown specifier type: ${type}`);
        }
      },
    },
    selectedVerbatimSpecifier: {
      // Allow the verbatim specifier to be retrieved or changed.
      get() { return this.selectedSpecifier.verbatimSpecifier; },
      set(verbatimSpecifier) { this.$store.commit('setSpecifierProps', { specifier: this.selectedSpecifier, props: { verbatimSpecifier } }); },
    },
    selectedSpecifierFirstTUnit: {
      // This is a temporary hack to reconcile the new single-tunit-to-specifier model
      // and the existing multiple-tunits-for-each-specifier model. This computed value
      // will return the first tunit and will later be replaced with selectedSpecifier.
      get() {
        // TODO remove hack.
        if (!has(this.selectedSpecifier, 'referencesTaxonomicUnits')) this.selectedSpecifier.referencesTaxonomicUnits = [{}];
        return this.selectedSpecifier.referencesTaxonomicUnits[0];
      },
    },
    addNewScientificName: {
      // Add a new scientific name to this specifier.
      get() {
        return '';
      },
      set(scientificName) {
        if (scientificName.trim() === '') return;
        this.$store.commit('addToSpecifier', { specifier: this.selectedSpecifierFirstTUnit, scientificName: { scientificName } });
      },
    },
    addNewSpecimen: {
      // Add a new specimen occurrence ID to this specifier.
      get() {
        return '';
      },
      set(occurrenceID) {
        if (occurrenceID.trim() === '') return;
        this.$store.commit('addToSpecifier', { specifier: this.selectedSpecifierFirstTUnit, specimen: { occurrenceID } });
      },
    },
    addNewExternalReference: {
      // Add a new external reference to this specifier.
      get() {
        return '';
      },
      set(extref) {
        if (extref.trim() === '') return;
        this.$store.commit('addToSpecifier', { specifier: this.selectedSpecifierFirstTUnit, externalReference: extref });
      },
    },
    externalReferences() {
      // Return a list of external references.
      if (!this.selectedSpecifierFirstTUnit) return [];
      if (!this.selectedSpecifierFirstTUnit.externalReferences) return [];
      return this.selectedSpecifierFirstTUnit.externalReferences;
    },
    ...mapState({
      currentPhyx: state => state.phyx.currentPhyx,
      loadedPhyx: state => state.phyx.loadedPhyx,
      phylogenies: state => state.phyx.currentPhyx.phylogenies,
      selectedPhylogeny: state => state.ui.display.phylogeny,
      selectedPhyloref: state => state.ui.display.phyloref,
      selectedSpecifier: state => state.ui.display.specifier,
      selectedTUnit: state => state.ui.display.tunit,
    }),
  },
  methods: {
    /* The following methods wrap scientific name and specimens for further processing. */
    wrappedScientificName(sciname) { return new ScientificNameWrapper(sciname); },
    wrappedSpecimen(specimen) { return new SpecimenWrapper(specimen); },
  },
};
</script>
