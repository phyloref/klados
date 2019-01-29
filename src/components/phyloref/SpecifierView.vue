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
              <div class="sciname">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    :value="sciname.scientificName"
                  >
                  <div class="input-group-append">
                    <button
                      class="btn btn-outline-secondary details"
                      type="button"
                      onclick="$(this).parents().filter('.sciname').find('.details').toggleClass('d-none')"
                    >
                      Show details
                    </button>
                    <button
                      class="btn btn-outline-secondary details d-none"
                      type="button"
                      onclick="$(this).parents().filter('.sciname').find('.details').toggleClass('d-none')"
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
                  <li>Scientific name: TODO</li>
                  <li>Genus: TODO</li>
                  <li>Specific epithet: TODO</li>
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
            <div
              v-for="(specimen, index) of selectedSpecifierFirstTUnit.includesSpecimens"
              class="input-group"
            >
              <input
                type="text"
                class="form-control"
                :value="specimen.occurrenceID"
              >
              <div class="input-group-append">
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                >
                  Show details
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
              v-for="(extref, index) of externalReferences"
              class="input-group"
            >
              <input
                type="text"
                class="form-control"
                :value="extref"
              >
              <div class="input-group-append">
                <button
                  class="btn btn-outline-secondary"
                  type="button"
                >
                  Show details
                </button>
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

      <!-- List of taxonomic units
      <div
        id="tunits-panel"
        class="panel panel-info"
        style="margin-top: 1em"
      >
        <div class="panel-heading">
          Taxonomic Units
        </div>
        <div
          v-if="!selectedTUnit"
          class="panel-body"
        >
          <p><em>Select a taxonomic unit or create a new one.</em></p>
        </div>
        <div
          v-if="selectedTUnit"
          class="panel-body"
        >
          <p>
            Each taxonomic unit can have any number of scientific names, external
            references and specimens. We recommend using a single taxonomic unit
            for each type of identifier.
          </p>

          <!-- Panel listing scientific names in this taxonomic unit
          <div class="col-md-12">
            <div class="panel panel-default">
              <div class="panel-heading">
                Scientific names
              </div>
              <div class="panel-body">
                <span v-if="!hasProperty(selectedTUnit, 'scientificNames') || selectedTUnit.scientificNames.length == 0">
                  <em>No scientific names provided.</em>
                </span>
                <div
                  v-for="(scname, scnameIndex) of selectedTUnit.scientificNames"
                  v-if="hasProperty(selectedTUnit, 'scientificNames')"
                  class="input-group"
                >
                  <span class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-danger"
                      @click="selectedTUnit.scientificNames.splice(scnameIndex, 1)"
                    >
                      <span class="glyphicon glyphicon-remove" />
                    </button>
                  </span>
                  <input
                    v-model.lazy="scname.scientificName"
                    type="text"
                    class="form-control"
                  >
                  <div class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-primary dropdown-toggle"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span class="glyphicon glyphicon-search" /> <span class="caret" />
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right">
                      <li class="dropdown-header">
                        Components of the scientific name
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          <em>Entered scientific name:</em> {{ scname.scientificName }}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          <em>Binomial name:</em> {{ getBinomialName(scname) }}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          <em>Genus:</em> {{ getGenus(scname) }}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          <em>Specific epithet:</em> {{ getSpecificEpithet(scname) }}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="panel-footer">
                <button
                  type="button"
                  class="btn btn-default"
                  @click="createOrAppend(selectedTUnit, 'scientificNames', {'scientificName': ''})"
                >
                  Add a new scientific name
                </button>
              </div>
            </div>
          </div>

          <!-- Panel listing external references in this taxonomic unit
          <div class="col-md-6">
            <div class="panel panel-default">
              <div class="panel-heading">
                External references
              </div>
              <div class="panel-body">
                <span v-if="!hasProperty(selectedTUnit, 'externalReferences') || selectedTUnit.externalReferences.length == 0">
                  <em>No external references provided.</em>
                </span>

                <div
                  v-for="(externalRef, externalRefIndex) of selectedTUnit.externalReferences"
                  v-if="hasProperty(selectedTUnit, 'externalReferences')"
                  class="input-group"
                >
                  <div class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-danger"
                      @click="selectedTUnit.externalReferences.splice(externalRefIndex, 1)"
                    >
                      <span class="glyphicon glyphicon-remove" />
                    </button>
                  </div>
                  <input
                    v-model.lazy="selectedTUnit.externalReferences[externalRefIndex]"
                    type="url"
                    class="form-control"
                  >
                  <div class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-primary"
                      @click="openURL(externalRef)"
                    >
                      Go to URL
                    </button>
                  </div>
                </div>
              </div>
              <div class="panel-footer">
                <button
                  type="button"
                  class="btn btn-default"
                  style="width: 100%"
                  href="#specifier-modal"
                  onclick="if(!('externalReferences' in vm.selectedTUnit)) Vue.set(vm.selectedTUnit, 'externalReferences', []); vm.selectedTUnit.externalReferences.push('http://example.org/');"
                >
                  Add a new external reference
                </button>
              </div>
            </div>
          </div>

          <!-- Panel listing specimens in this taxonomic unit
          <div class="col-md-6">
            <div class="panel panel-default">
              <div class="panel-heading">
                Specimens
              </div>
              <div class="panel-body">
                <span v-if="!hasProperty(selectedTUnit, 'includesSpecimens') || selectedTUnit.includesSpecimens.length == 0">
                  <em>No specimens provided.</em>
                </span>
                <div
                  v-for="(specimen, specimenIndex) of selectedTUnit.includesSpecimens"
                  v-if="hasProperty(selectedTUnit, 'includesSpecimens')"
                  class="input-group"
                >
                  <span class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-danger"
                      @click="selectedTUnit.includesSpecimens.splice(scnameIndex, 1)"
                    >
                      <span class="glyphicon glyphicon-remove" />
                    </button>
                  </span>
                  <input
                    v-model.lazy="specimen.occurrenceID"
                    type="text"
                    class="form-control"
                  >
                  <div class="input-group-btn">
                    <button
                      type="button"
                      class="btn btn-primary dropdown-toggle"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span class="glyphicon glyphicon-search" /> <span class="caret" />
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right">
                      <li class="dropdown-header">
                        Specimen components
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          Occurrence ID: {{ specimen.occurrenceID }}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          Institution Code: {{ getInstitutionCode(specimen) }}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          Collection Code: {{ getCollectionCode(specimen) }}
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          onclick="return false"
                        >
                          Catalog Number: {{ getCatalogNumber(specimen) }}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="panel-footer">
                <button
                  type="button"
                  class="btn btn-default"
                  @click="createOrAppend(selectedTUnit, 'includesSpecimens', {'occurrenceID': ''})"
                >
                  Add a new specimen
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- List of taxonomic units, including the option to add new taxonomic units
        <div class="list-group">
          <!--
          <div
            v-for="(tunit, tunitIndex) of selectedSpecifier.referencesTaxonomicUnits"
            class="list-group-item"
            :class="{active: selectedTUnit === tunit}"
            :title="getTaxonomicUnitLabel(tunit)"
            @click="selectedTUnit = tunit"
          >
            {{ getTaxonomicUnitLabel(tunit) }}

            <a
              :title="'Delete ' + getTaxonomicUnitLabel(tunit)"
              href="javascript: void(0)"
              class="icon-danger close glyphicon glyphicon-remove"
              @click="deleteTUnit(tunit)"
            />
          </div>
          <a
            class="list-group-item"
            href="javascript: void(0)"
            onclick="vm.selectedSpecifier.referencesTaxonomicUnits.push(vm.createEmptyTaxonomicUnit(vm.selectedSpecifier.referencesTaxonomicUnits.length + 1))"
          >
            <strong>Add new taxonomic unit</strong>
          </a>-->
    </div>
  </div>
</template>

    <!-- TODO: insert specifier resolution on phylogeny here -->
  </div>
</template>

<script>
import { has } from 'lodash';
import { mapState } from 'vuex';
import ModifiedCard from '../cards/ModifiedCard.vue';

export default {
  name: 'SpecifierView',
  components: {
    ModifiedCard,
  },
  computed: {
    loadedSpecifier() {
      const loadedPhyx = this.loadedPhyx;
      const currentPhyx = this.currentPhyx;
      const loadedPhyloref = loadedPhyx.phylorefs[currentPhyx.phylorefs.indexOf(this.selectedPhyloref)];
      if (loadedPhyloref === undefined) return undefined;
      if (has(this.selectedPhyloref, 'internalSpecifiers') && this.selectedPhyloref.internalSpecifiers.includes(this.selectedSpecifier)) return loadedPhyloref.internalSpecifiers[this.selectedPhyloref.internalSpecifiers.indexOf(this.selectedSpecifier)];
      if (has(this.selectedPhyloref, 'externalSpecifiers') && this.selectedPhyloref.externalSpecifiers.includes(this.selectedSpecifier)) return loadedPhyloref.externalSpecifiers[this.selectedPhyloref.externalSpecifiers.indexOf(this.selectedSpecifier)];
      return undefined;
    },
    specifierType: {
      get() {
        if (has(this.selectedPhyloref, 'internalSpecifiers') && this.selectedPhyloref.internalSpecifiers.includes(this.selectedSpecifier)) return 'Internal specifier';
        if (has(this.selectedPhyloref, 'externalSpecifiers') && this.selectedPhyloref.externalSpecifiers.includes(this.selectedSpecifier)) return 'External specifier';
        return undefined;
      },
      set(type) {
        if (type == 'Internal specifier') {
          this.$store.commit('setSpecifierType', { phyloref: this.selectedPhyloref, specifier: this.selectedSpecifier, specifierType: 'internal' });
        } else if (type == 'External specifier') {
          this.$store.commit('setSpecifierType', { phyloref: this.selectedPhyloref, specifier: this.selectedSpecifier, specifierType: 'external' });
        } else {
          throw new Error(`Unknown specifier type: ${type}`);
        }
      },
    },
    selectedVerbatimSpecifier: {
      get() { return this.selectedSpecifier.verbatimSpecifier; },
      set(verbatimSpecifier) { this.$store.commit('setSpecifierProps', { specifier: this.selectedSpecifier, verbatimSpecifier }); },
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
      get() {
        return '';
      },
      set(scientificName) {
        if (scientificName.trim() === '') return;
        this.$store.commit('addToSpecifier', { specifier: this.selectedSpecifierFirstTUnit, scientificName: { scientificName } });
      },
    },
    addNewSpecimen: {
      get() {
        return '';
      },
      set(occurrenceID) {
        if (occurrenceID.trim() === '') return;
        this.$store.commit('addToSpecifier', { specifier: this.selectedSpecifierFirstTUnit, specimen: { occurrenceID } });
      },
    },
    addNewExternalReference: {
      get() {
        return '';
      },
      set(extref) {
        if (extref.trim() === '') return;
        this.$store.commit('addToSpecifier', { specifier: this.selectedSpecifierFirstTUnit, externalReference: extref });
      },
    },
    externalReferences () {
      if(!this.selectedSpecifierFirstTUnit) return [];
      if(!this.selectedSpecifierFirstTUnit.externalReferences) return [];
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
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
