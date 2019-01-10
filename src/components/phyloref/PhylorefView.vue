<template>
  <div>
    <!-- Add a warning if this phyloreference has changed -->
    <ModifiedCard
      message="This phyloreference has been modified since being loaded! Use 'Save as JSON' to save your changes."
      :compare="selectedPhyloref"
      :compareTo="currentPhyx.phylorefs[currentPhyx.phylorefs.indexOf(selectedPhyloref)]"
    />

    <!-- Phyloreference information -->
    <template v-if="selectedSpecifier === undefined && selectedPhylogeny === undefined">
      <div class="card">
        <h5 class="card-header">
          Phyloreference information
        </h5>

        <div class="card-body">
          <form>
            <!-- Phyloreference label -->
            <div class="form-group row">
              <label
                for="label"
                class="col-form-label col-md-2"
              >
                Label
              </label>
              <div class="col-md-10">
                <input
                  id="label"
                  v-model="selectedPhyloref.label"
                  type="text"
                  class="form-control"
                  placeholder="Phyloreference label"
                >
              </div>
            </div>

            <!-- Phyloreference clade definition -->
            <div class="form-group row">
              <label
                for="definition"
                class="col-form-label col-md-2"
              >
                Clade definition
              </label>
              <div class="col-md-10">
                <textarea
                  id="definition"
                  v-model.lazy="selectedPhyloref.cladeDefinition"
                  class="form-control"
                  rows="6"
                  placeholder="Phylogenetic clade definition"
                />
              </div>
            </div>

            <!-- Phyloreference curator comments -->
            <div class="form-group row">
              <label
                for="curator-comments"
                class="col-form-label col-md-2"
              >
                Curator comments
              </label>
              <div class="col-md-10">
                <textarea
                  id="curator-comments"
                  v-model.lazy="selectedPhyloref.curatorComments"
                  class="form-control"
                  rows="2"
                  placeholder="Curator notes relating to this phyloreference"
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- List of specifiers associated with this phyloreference -->
      <div
        id="specifiers"
        class="card mt-2"
      >
        <h5 class="card-header">
          Specifiers
        </h5>
        <div class="list-group list-group-flush">
          <div
            v-for="(specifier, specifierIndex) of selectedPhyloref.internalSpecifiers"
            class="list-group-item"
          ><SpecifierDiv type="Internal" :specifier="specifier" /></div>
          <div
            v-for="(specifier, specifierIndex) of selectedPhyloref.externalSpecifiers"
            class="list-group-item"
          ><SpecifierDiv type="External" :specifier="specifier" /></div>
        </div>
          <!--
          <div
            v-for=""
            v-if="selectedPhyloref"
            :id="'specifier-' + specifierIndex"
            class="input-group"
          >
            <!-- Buttons before specifier label
            <div class="input-group-btn">
              <!-- Delete button: initially hidden, made visible by clicking the "Delete some specifiers" button
              <button
                v-if="deletingSpecifiersMode"
                type="button"
                class="btn btn-danger"
                @click="deleteSpecifier(selectedPhyloref, specifier)"
              >
                <span class="glyphicon glyphicon-remove" />
              </button>

              <!-- Match results with dropdown menu
              <button
                type="button"
                class="btn dropdown-toggle"
                :class="{ 'btn-warning': getAllNodeLabelsMatchedBySpecifier(specifier).length == 0, 'btn-success': getAllNodeLabelsMatchedBySpecifier(specifier).length > 0}"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                @click="dropdownTargetForSpecifier = 'matchResult'"
              >
                <span
                  class="glyphicon"
                  :class="{ 'glyphicon-asterisk': getAllNodeLabelsMatchedBySpecifier(specifier).length == 0, 'glyphicon-ok': (getAllNodeLabelsMatchedBySpecifier(specifier).length > 0) || hasProperty(specifier, 'specifierWillNotMatch') }"
                />
              </button>
              <ul
                v-if="dropdownTargetForSpecifier == 'matchResult'"
                class="dropdown-menu dropdown-menu-left"
              >
                <li class="dropdown-header">
                  Match result
                </li>
                <li v-if="getAllNodeLabelsMatchedBySpecifier(specifier).length == 0">
                  <a
                    href="#"
                    onclick="return false;"
                  >
                    <em>No matches</em>
                  </a>
                </li>
                <li v-for="(nodeLabel, nodeLabelIndex) of getAllNodeLabelsMatchedBySpecifier(specifier)">
                  <a
                    href="#"
                    onclick="return false;"
                  >
                    {{ nodeLabel }}
                  </a>
                </li>
                <template v-if="getAllNodeLabelsMatchedBySpecifier(specifier).length === 0">
                  <li class="dropdown-header">
                    Specifier will not match
                  </li>
                  <li>
                    <a
                      href="#specifiers"
                      @click="promptAndSetDict('Why couldn\'t this specifier be matched?', specifier, 'specifierWillNotMatch')"
                    >
                      <template v-if="hasProperty(specifier, 'specifierWillNotMatch')">
                        Reason <small>(click to edit)</small>: {{ specifier.specifierWillNotMatch }}
                      </template>
                      <template v-else>
                        <em>No reason given: click here to set one</em>
                      </template>
                    </a>
                  </li>
                </template>
              </ul>
              <ul
                v-if="dropdownTargetForSpecifier == 'specifierType'"
                class="dropdown-menu dropdown-menu-left"
              >
                <li class="dropdown-header">
                  Specifier type
                </li>
                <li :class="{active: getSpecifierType(selectedPhyloref, specifier) == 'Internal'}">
                  <a
                    href="#"
                    onclick="return false;"
                    @click="setSpecifierType(selectedPhyloref, specifier, 'Internal')"
                  >
                    Internal specifier
                  </a>
                </li>
                <li :class="{active: getSpecifierType(selectedPhyloref, specifier) == 'External'}">
                  <a
                    href="#"
                    onclick="return false;"
                    @click="setSpecifierType(selectedPhyloref, specifier, 'External')"
                  >
                    External specifier
                  </a>
                </li>
              </ul>

              <!-- Specifier type with dropdown menu: internal or external specifier
              <button
                type="button"
                class="btn btn-default dropdown-toggle"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                @click="dropdownTargetForSpecifier = 'specifierType'"
              >
                {{ getSpecifierType(selectedPhyloref, specifier) }} <span class="caret" />
              </button>
            </div>

            <!-- Specifier label
            <input
              type="text"
              disabled
              class="form-control"
              :value="getSpecifierLabel(specifier)"
              :title="getSpecifierLabel(specifier)"
            >

            <!-- Buttons after specifier label: edit button
            <div class="input-group-btn">
              <button
                type="button"
                class="btn btn-primary"
                @click="startTUnitEditorModal('specifier', getSpecifierLabel(specifier), specifier)"
              >
                <span class="glyphicon glyphicon-edit" />
              </button>
            </div>
          </div>
        </div>-->

        <!-- Add or delete specifiers -->
        <div class="panel-footer">
          <button
            type="button"
            class="btn btn-default"
            onclick="vm.selectedPhyloref.externalSpecifiers.push(vm.createEmptySpecifier());"
          >
            Add new specifier
          </button>
          <button
            type="button"
            class="btn btn-default"
            @click="deletingSpecifiersMode = !deletingSpecifiersMode"
          >
            Delete some specifiers
          </button>
        </div>
      </div>
    </template>

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
          </a>
        </div>
      </div>
    </template>

    <!--
  Panel with information on expected and actual resolution
  We should:
    - display all phylogenies when looking up a phyloreference or specifiers
    - display only the selected phylogeny when it's selected
    <template v-for="(phylogeny, phylogenyIndex) of currentPhyx.phylogenies">
      <template v-if="selectedPhylogeny === undefined || selectedPhylogeny === phylogeny">
        <div class="panel panel-info">
          <div class="panel-heading">
            Expected and actual resolution on getPhylogenyLabel(phylogeny)
          </div>
          <div class="panel-body">
            <!-- Node(s) this phyloreference is expected to resolve to
            <label
              for="curator-comments"
              class="control-label col-md-2"
            >
              Expected nodes
            </label>
            <div class="input-group col-md-10">
              <div class="input-group">
                <!-- Display the phylogeny where this node is expected to match
                <span class="input-group-btn">
                  <a
                    class="btn btn-default"
                    :href="'#current_expected_label_phylogeny' + phylogenyIndex"
                    title="Click here to jump to the expected label"
                    type="button"
                  >
                    Go to node
                  </a>
                </span>

                <!-- Display the matching node(s)
                <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length === 0">
                  <!-- We matched no nodes
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    value="No nodes could be matched"
                  >
                </template>

                <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length === 1">
                  <!-- We matched exactly one node
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref)[0]"
                  >
                </template>

                <template v-if="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length > 1">
                  <!-- We matched more than one node
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    :value="getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).length + ' nodes matched: ' + getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).join(', ')"
                  >
                </template>

                <!-- Display a dropdown menu that allows the modified label to be changed.
                <div class="input-group-btn">
                  <button
                    type="button"
                    class="btn btn-primary dropdown-toggle"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    Change <span class="caret" />
                  </button>
                  <ul class="dropdown-menu dropdown-menu-right">
                    <!-- List every labeled node in this phylogeny.
                    <li class="dropdown-header">
                      Labeled internal nodes in this phylogeny
                    </li>
                    <li
                      v-for="nodeLabel of getNodeLabelsInPhylogeny(phylogeny, 'internal').sort()"
                      :class="{active: getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).includes(nodeLabel)}"
                    >
                      <a
                        href="#selected-phyloref"
                        @click="togglePhylorefExpectedNodeLabel(phylogeny, selectedPhyloref, nodeLabel)"
                      >
                        {{ nodeLabel }}
                      </a>
                    </li>
                    <li class="dropdown-header">
                      Labeled terminal nodes in this phylogeny
                    </li>
                    <li
                      v-for="nodeLabel of getNodeLabelsInPhylogeny(phylogeny, 'terminal').sort()"
                      :class="{active: getPhylorefExpectedNodeLabels(phylogeny, selectedPhyloref).includes(nodeLabel)}"
                    >
                      <a
                        href="#selected-phyloref"
                        @click="togglePhylorefExpectedNodeLabel(phylogeny, selectedPhyloref, nodeLabel)"
                      >
                        {{ nodeLabel }}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Node(s) this phyloreference actually resolved to
            <label
              for="curator-comments"
              class="control-label col-md-2"
            >
              Actual nodes
            </label>
            <div class="input-group col-md-10">
              <!-- If phylogenies were loaded, we need to display a selector for each phylogeny
              <div class="input-group">
                <!-- Display the phylogeny where this node is expected to match
                <span class="input-group-btn">
                  <a
                    class="btn btn-default"
                    :href="'#current_pinning_node_phylogeny' + phylogenyIndex"
                    title="Click here to jump to this node"
                    type="button"
                  >
                    Go to node
                  </a>
                </span>

                <!-- Display the matching node(s)
                <template v-if="!hasProperty(reasoningResults, 'phylorefs')">
                  <input
                    readonly
                    type="text"
                    class="form-control"
                    value="Click 'Reason' to reason over all phyloreferences."
                  >
                </template>
                <template v-else>
                  <template v-if="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length === 0">
                    <!-- We matched no nodes
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="'No nodes could be matched'"
                    >
                  </template>
                  <template v-if="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length === 1">
                    <!-- We matched exactly one node
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny, false)[0]"
                    >
                  </template>
                  <template v-if="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length > 1">
                    <!-- We matched more than one node
                    <input
                      readonly
                      type="text"
                      class="form-control"
                      :value="getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny).length + ' nodes matched: ' + getResolvedNodesForPhylogeny(selectedPhyloref, phylogeny, false).join(', ')"
                    >
                  </template>
                </template>

                <!-- Display a button that activates reasoning.
                <div class="input-group-btn">
                  <button
                    type="button"
                    class="btn btn-primary start-reasoning"
                    @click="reasonOverPhyloreferences()"
                  >
                    Reason
                  </button>
                </div>
              </div>
            </div>

            <!-- Display the phylogeny
            <div
              class="well"
              style="margin-top: 1em"
            >
              <svg
                v-if="getPhylogenyParsingErrors(phylogeny).length === 0"
                :id="'phylogeny-svg-view-' + selectedPhylorefIndex + '-phylogeny-' + phylogenyIndex"
                width="100%"
                :alt="getPhylogenyAsNewick('#phylogeny-svg-view-' + selectedPhylorefIndex + '-phylogeny-' + phylogenyIndex, phylogeny)"
              />
            </div>
          </div>
          <div class="panel-footer">
            <div
              class="btn-group btn-group-justified"
              role="group"
              aria-label="Actions for phylogeny"
            >
              <!-- Dropdown button for vertical spacing
              <div
                class="btn-group"
                role="group"
              >
                <button
                  type="button"
                  class="btn btn-default"
                  @click="resetSVG(); renderTree('#phylogeny-svg-view-' + selectedPhylorefIndex + '-phylogeny-' + phylogenyIndex, phylogeny)"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>-->
  </div>
</template>

<script>
import { mapState } from 'vuex';
import SpecifierDiv from '../phyloref/SpecifierDiv.vue';
import ModifiedCard from '../cards/ModifiedCard.vue';

export default {
  name: 'PhylorefView',
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
  }),
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
