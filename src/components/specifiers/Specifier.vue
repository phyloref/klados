<!--
  The Specifier component is used in two places:
  - The PhylorefView uses it to display specifiers for phyloreferences.
  - The PhylogenyView uses it to display taxonomic units for phylogenies.

  This means that the Specifier component needs to be created with one of two sets of arguments:
  - `phyloref` when the specifier to be edited is part of a phyloreference.
  - `phylogeny` and `nodeLabel` when the taxonomic unit to be edited is part of a phylogeny.
-->

<template>
  <div class="col-md-12">
    <div class="input-group mb-1">
      <div class="input-group-prepend">
        <!-- Display and change the specifier class. -->
        <button
          class="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ specifierClass }}
        </button>
        <div class="dropdown-menu">
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'Taxon'}"
            href="javascript:;"
            @click="specifierClass = 'Taxon'"
          >Taxon</a>
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'Specimen'}"
            href="javascript:;"
            @click="specifierClass = 'Specimen'"
          >Specimen</a>
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'External reference'}"
            href="javascript:;"
            @click="specifierClass = 'External reference'"
          >External reference</a>
        </div>
      </div>
      <!-- For taxon specifiers only, display all possible nomenclatural codes. -->
      <div
        v-if="specifierClass === 'Taxon'"
        class="input-group-prepend"
      >
        <button
          class="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ nomenclaturalCodeObj.shortName }}
        </button>
        <div class="dropdown-menu">
          <a
            v-for="(nomenCode, nomenCodeIndex) of nomenCodes"
            class="dropdown-item"
            href="javascript:;"
            @click="nomenclaturalCode = nomenCode.iri"
            :key="nomenCode.iri"

            :class="{active: nomenclaturalCode === nomenCode.iri }"
          >
            {{ nomenCode.label }}
          </a>
        </div>
      </div>
      <!-- Display a specifierLabel describing the specifier. -->
      <input
        v-model="specifierLabel"
        readonly
        type="text"
        class="form-control"
      >
      <!-- The "Edit/Collapse" button can be used to edit this specifier. -->
      <div class="input-group-append">
        <button
          class="btn btn-outline-secondary"
          :class="{active: expand}"
          @click="expand = !expand"
        >
          {{ (expand) ? 'Collapse' : 'Edit' }}
        </button>
      </div>
      <!-- The "Delete" button can be used to delete this specifier. -->
      <div class="input-group-append">
        <button
          class="btn btn-danger"
          @click="deleteSpecifier()"
        >
          <b-icon-trash></b-icon-trash>
        </button>
      </div>
    </div>

    <!-- The Edit card is used to edit this specifier -->

    <div
      v-if="expand"
      class="card mt-1 mb-3"
    >
      <div class="card-body">
        <h5 class="card-title">
          Specifier details
        </h5>

        <!-- Specifier type: internal or external. Only phylorefs have this, so we shouldn't display this for others. -->
        <div v-if="phyloref" class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="specifier-type"
          >
            Specifier type
          </label>
          <div class="col-md-10">
            <select
              id="specifier-type"
              v-model="specifierType"
              class="form-control"
            >
              <option value="Internal">
                Internal specifier
              </option>
              <option value="External">
                External specifier
              </option>
            </select>
          </div>
        </div>

        <!-- Specifier label -->
        <div class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="specifier-label"
          >
            Specifier label
          </label>
          <div class="col-md-10">
            <input
              id="specifier-label"
              v-model="verbatimLabel"
              class="form-control"
              @change="updateSpecifier()"
            >
          </div>
        </div>

        <!-- Specifier class -->
        <div class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="specifier-class"
          >
            Specifier class
          </label>
          <div class="col-md-10">
            <select
              id="specifier-class"
              v-model="specifierClass"
              class="form-control"
              @change="updateSpecifier()"
            >
              <option value="Taxon">
                Taxon
              </option>
              <option value="Specimen">
                Specimen
              </option>
              <option value="External reference">
                External reference
              </option>
            </select>
          </div>
        </div>

        <!--
          We provide three different possible displays for the three different
          types here: Taxon, Specimen, External Reference.
        -->
        <template v-if="specifierClass === 'Taxon'">
          <!-- Specifier class -->
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="nomen-code"
            >
              Nomenclatural code
            </label>
            <div class="col-md-10">
              <select
                id="nomen-code"
                v-model="nomenclaturalCode"
                class="form-control"
              >
                <option
                  v-for="(nomenCode, nomenCodeIndex) of nomenCodes"
                  :key="nomenCode.iri"
                  :value="nomenCode.iri"
                >
                  {{ nomenCode.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="name-complete"
            >
              Binomial/trinomial name
            </label>
            <div class="col-md-10 input-group">
              <input
                id="name-complete"
                readonly
                :value="nameComplete"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="genus"
            >
              Genus
            </label>
            <div class="col-md-10 input-group">
              <input
                id="genus"
                v-model="genusPart"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="specific-epithet"
            >
              Specific epithet
            </label>
            <div class="col-md-10 input-group">
              <input
                id="specific-epithet"
                v-model="specificEpithet"
                class="form-control"
              >
            </div>
          </div>

          <div
            class="form-group row"
          >
            <label
              class="col-form-label col-md-2"
              for="infraspecific-epithet"
            >
              Infraspecific epithet
            </label>
            <div class="col-md-10 input-group">
              <input
                id="infraspecific-epithet"
                v-model="infraspecificEpithet"
                class="form-control"
              >
            </div>
          </div>
        </template>

        <template v-if="specifierClass === 'Specimen'">
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="occurrence-id"
            >
              Occurrence ID
            </label>
            <div class="col-md-10">
              <div class="input-group">
                <input
                  id="occurrence-id"
                  v-model="occurrenceID"
                  class="form-control"
                  placeholder="Enter the occurrence ID of the specimen here, e.g. 'MVZ:Herp:246033' or '000866d2-c177-4648-a200-ead4007051b9'"
                >
              </div>
              <small id="occurrenceIDHelp" class="form-text text-muted">As
                <a href="https://dwc.tdwg.org/terms/#dwc:occurrenceID" target="_blank">per Darwin Core</a>, we recommend
                a persistent, globally unique identifier such as a Darwin Core Triple, a URI/IRI or a UUID.
              </small>
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="collection-code"
            >
              Institution code
            </label>
            <div class="col-md-10 input-group">
              <input
                id="collection-code"
                readonly
                class="form-control"
                :value="institutionCode"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="collection-code"
            >
              Collection code
            </label>
            <div class="col-md-10 input-group">
              <input
                id="collection-code"
                readonly
                class="form-control"
                :value="collectionCode"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="catalog-number"
            >
              Catalog number
            </label>
            <div class="col-md-10 input-group">
              <input
                id="catalog-number"
                readonly
                class="form-control"
                :value="catalogNumber"
              >
            </div>
          </div>
        </template>

        <template v-if="specifierClass === 'External reference'">
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="external-reference"
            >
              External reference as URI
            </label>
            <div class="col-md-10 input-group">
              <input
                id="external-reference"
                v-model="externalReference"
                class="form-control"
              >
              <div class="input-group-append">
                <a
                  class="btn btn-outline-secondary"
                  target="_blank"
                  :href="externalReference"
                >
                  Open in new window
                </a>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * Displays a specifier as a textfield/expanded field.
 *
 * Here is a quick guide to how this is wired together:
 *  - Individual text fields will update their synthesized field (i.e. editing genus
 *    will update specifierText).
 *  - Editing or otherwise updating the synthesized field will overwrite
 *    locally stored specifier (specifier).
 *  - If our local specifier falls out of sync with the remoteSpecifier, we
 *    overwrite it using the specifier.
 */

import { BIconTrash } from 'bootstrap-vue';
import {
  PhylorefWrapper,
  TaxonomicUnitWrapper,
  TaxonConceptWrapper,
  TaxonNameWrapper,
  SpecimenWrapper,
} from '@phyloref/phyx';
import {
  has, isEqual, cloneDeep, uniqueId,
} from 'lodash';

export default {
  name: 'Specifier',
  components: {
    BIconTrash,
  },
  props: {
    specifierIndex: {
      default: () => uniqueId(),
    },
    remoteSpecifier: { /* The specifier to display and edit */
      type: Object,
      required: true,
    },
    remoteSpecifierId: { /* An ID for this specifier. We recalculate if this ID changes. */
      type: String,
      required: false,
      default: () => uniqueId('remoteSpecifierId'),
    },
    /*
     * There are two ways of visualizing a specifier:
     * - The specifier may be a part of a phyloref, or
     * - The specifier (really a taxonomic unit) may be a part of a phylogeny via the `representsTaxonomicUnits`
     *   property of the `additionalNodeProperties` dictionary. This is specified in two ways: a phylogeny as
     *   well as a nodeLabel.
     */
    /* The phyloreference containing this specifier */
    phyloref: {
      type: Object,
      required: false,
    },
    /* The phylogeny and nodeLabel containing this specifier (really a taxonomic unit). */
    phylogeny: {
      type: Object,
      required: false,
    },
    nodeLabel: {
      type: String,
      required: false,
    },
  },
  data() {
    // All of this will be filled in by loadSpecifier().
    return {
      // Has this specifier been expanded for editing?
      expand: false,

      // Fields for all specifier types.
      specifierClass: "",
      verbatimLabel: "",

      // Fields for taxon names.
      nomenclaturalCode: "",
      genusPart: "",
      specificEpithet: "",
      infraspecificEpithet: "",

      // Fields for specimens.
      occurrenceID: "",

      // Fields for external reference.
      externalReference: "",
    };
  },
  computed: {
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    nomenclaturalCodeObj() {
      return TaxonNameWrapper.getNomenCodeDetails(this.nomenclaturalCode);
    },
    // Taxon name fields.
    nameComplete() {
      if (this.genusPart && this.specificEpithet && this.infraspecificEpithet) {
        return `${this.genusPart} ${this.specificEpithet} ${this.infraspecificEpithet}`;
      } else if (this.genusPart && this.specificEpithet) {
        return `${this.genusPart} ${this.specificEpithet}`;
      } else if (this.genusPart) {
        return this.genusPart;
      } else return "";
    },
    // Specimen fields.
    wrappedSpecimen() {
      return SpecimenWrapper.fromOccurrenceID(this.occurrenceID);
    },
    institutionCode() {
      const sbc = new SpecimenWrapper();
      sbc.catalogNumber
      return this.wrappedSpecimen.institutionCode;
    },
    collectionCode() {
      return this.wrappedSpecimen.collectionCode;
    },
    catalogNumber() {
      return this.wrappedSpecimen.catalogNumber;
    },
    // Specifier type.
    specifierType: {
      get() {
        if (!this.phyloref) return undefined;
        return new PhylorefWrapper(this.phyloref).getSpecifierType(this.remoteSpecifier);
      },
      set(type) {
        if (!this.phyloref) return undefined;

        this.$store.commit(
          'setSpecifierType',
          {
            phyloref: this.phyloref,
            specifier: this.remoteSpecifier,
            specifierType: type,
          },
        );
      },
    },
    specifierLabel() {
      if (this.verbatimLabel) return this.verbatimLabel;
      switch (this.specifierClass) {
        case 'Taxon': return this.nameComplete;
        case 'Specimen': return this.occurrenceID;
      }
      return '';
    },

  },
  watch: {
    // If any of our input parameters change, we should reload this specifier.
    phyloref() {
      this.loadSpecifier();
    },
    phylogeny() {
      this.loadSpecifier();
    },
    nodeLabel() {
      this.loadSpecifier();
    },
    remoteSpecifier() {
      this.loadSpecifier();
    },
    remoteSpecifierId() {
      this.loadSpecifier();
    },
  },
  mounted() {
    this.loadSpecifier();
  },
  methods: {
    getSpecifierClass(tunit) {
      // Return the specifier class for a tunit.
      if (tunit.types.length > 0) {
        switch (tunit.types[0]) {
          case TaxonomicUnitWrapper.TYPE_TAXON_CONCEPT:
            return 'Taxon';

          case TaxonomicUnitWrapper.TYPE_SPECIMEN:
            return 'Specimen';
        }

        // If it has an '@id', it is an external reference to that '@id'.
        if (has(tunit, '@id')) {
          return 'External reference';
        }
      }

      return undefined;
    },
    loadSpecifier() {
      console.log('(Re)loading specifier from: ', this.remoteSpecifier);

      // Recalculate the entered values.
      const tunit = new TaxonomicUnitWrapper(this.remoteSpecifier || {});

      // If it has an '@id', it is an external reference to that '@id'.
      if (has(this.remoteSpecifier, '@id')) {
        this.specifierClass = 'External reference';
        this.externalReference = this.remoteSpecifier['@id'];
        // tunit.label adds '<>s' around the @id. We work around that by trying
        // to read the label directly.
        this.verbatimLabel = this.remoteSpecifier.label || tunit.label;
      } else {
        this.verbatimLabel = tunit.label;
        this.specifierClass = this.getSpecifierClass(tunit) || 'Taxon';
      }

      const taxonConceptWrapped = new TaxonConceptWrapper(tunit.taxonConcept);
      if (taxonConceptWrapped && taxonConceptWrapped.taxonName) {
        const taxonNameWrapped = new TaxonNameWrapper(taxonConceptWrapped.taxonName);

        this.genusPart = taxonNameWrapped.genusPart;
        this.specificEpithet = taxonNameWrapped.specificEpithet;
        this.infraspecificEpithet = taxonNameWrapped.infraspecificEpithet;

        this.nomenclaturalCode = taxonNameWrapped.nomenclaturalCode
          || this.$store.getters.getDefaultNomenCodeURI;
      }

      if (tunit.specimen) {
        const specimenWrapped = new SpecimenWrapper(tunit.specimen);

        this.occurrenceID = specimenWrapped.occurrenceID;
      }
    },
    deleteSpecifier() {
      // Update remoteSpecifier to what we've got currently entered.
      const confirmed = confirm('Are you sure you want to delete this specifier?');
      if (confirmed) {
        if (this.phyloref) {
          console.log("Deleting specifier from phyloref: ", this.phyloref, this.remoteSpecifier);
          this.$store.commit('deleteSpecifier', {
            phyloref: this.phyloref,
            specifier: this.remoteSpecifier,
          });
        } else if (this.phylogeny && this.nodeLabel) {
          console.log("Deleting taxonomic unit from phylogeny: ", this.phylogeny, this.nodeLabel, this.remoteSpecifier);
          this.$store.commit('replaceTUnitForPhylogenyNode', {
            phylogeny: this.phylogeny,
            nodeLabel: this.nodeLabel,
            tunit: this.remoteSpecifier,
            delete: true,
          });
        }
      }
    },
    updateSpecifier() {
      // Check the specifierClass before we figure out how to save them.
      let result;
      switch (this.specifierClass) {
        case 'Taxon': {
          // Set up a taxon name for this taxon.
          const tname = {
            "@type": TaxonNameWrapper.TYPE_TAXON_NAME,
            label: this.verbatimLabel,
            nameComplete: this.nameComplete,
            genusPart: this.genusPart,
            specificEpithet: this.specificEpithet,
            infraspecificEpithet: this.infraspecificEpithet,
          };

          // We don't actually support accordingTo citations here.
          const accordingTo = undefined;

          result = TaxonConceptWrapper.wrapTaxonName(tname, accordingTo);
          break;
        }

        case 'Specimen':
          result = SpecimenWrapper.fromOccurrenceID(this.enteredOccurrenceID);
          break;

        case 'External reference':
          result = {
            // We store the external reference in the '@id' field.
            '@id': this.externalReference || this.verbatimLabel || '',
          };
          break;

        default:
          // Make sure we have a result, even if it's just a blank object.
          result = {};
      }

      // Add the entered verbatim label.
      if (this.verbatimLabel) {
        result.label = this.verbatimLabel;
      }

      if (this.phyloref) {
        console.log('Updating specifier in ', this.phyloref, ' as ', result, ' differs from ', this.remoteSpecifier);
        this.$store.commit('setSpecifierProps', {
          specifier: this.remoteSpecifier,
          props: result,
        });
      } else if (this.phylogeny && this.nodeLabel) {
        console.log(
          "Updating tunit in ",
          this.phylogeny,
          " with node label ",
          this.nodeLabel,
          " as ",
          result,
          " differs from ",
          this.remoteSpecifier
        );
        this.$store.commit('replaceTUnitForPhylogenyNode', {
          phylogeny: this.phylogeny,
          nodeLabel: this.nodeLabel,
          tunit: this.remoteSpecifier,
          tunit_new: result,
        });
      } else {
        console.error("Specifier has neither phyloref nor phylogeny/nodeLabel combination: ", this);
      }
    },
  },
};
</script>

<style>
.hand-cursor {
  cursor: pointer;
}
</style>
