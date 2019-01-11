<template>
  <div>
    <!-- Add a warning if this phyloreference has changed -->
    <!-- TODO: change to be about specifiers -->
    <ModifiedCard
      message="This phyloreference has been modified since being loaded! Use 'Save as JSON' to save your changes."
      :compare="selectedPhyloref"
      :compareTo="currentPhyx.phylorefs[currentPhyx.phylorefs.indexOf(selectedPhyloref)]"
    />

    <!-- Panels with information on the current specifier -->
    <template v-if="selectedSpecifier !== undefined">
      <label
        for="verbatim-specifier"
        class="control-label"
      >
        Verbatim specifier
      </label>
      <input
        id="verbatim-specifier"
        v-model.trim="selectedSpecifier.verbatimSpecifier"
        type="text"
        class="form-control"
        placeholder="Enter the verbatim description of this specifier"
      >

      <!-- List of taxonomic units -->
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

          <!-- Panel listing scientific names in this taxonomic unit -->
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

          <!-- Panel listing external references in this taxonomic unit -->
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

          <!-- Panel listing specimens in this taxonomic unit -->
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

        <!-- List of taxonomic units, including the option to add new taxonomic units -->
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
import { mapState } from 'vuex';
import SpecifierDiv from '../phyloref/SpecifierDiv.vue';
import ModifiedCard from '../cards/ModifiedCard.vue';

export default {
  name: 'SpecifierView',
  components: {
    ModifiedCard,
    SpecifierDiv,
  },
  computed: mapState({
    currentPhyx: state => state.phyx.currentPhyx,
    loadedPhyx: state => state.phyx.loadedPhyx,
    phylogenies: state => state.phyx.currentPhyx.phylogenies,
    selectedPhylogeny: state => state.ui.display.phylogeny,
    selectedPhyloref: state => state.ui.display.phyloref,
    selectedSpecifier: state => state.ui.display.specifier,
    selectedTUnit: state => state.ui.display.tunit,
  }),
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
