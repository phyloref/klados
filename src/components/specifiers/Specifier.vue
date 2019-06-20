<template>
  <div class="col-md-12">
    <div class="input-group mb-1">
      <div class="input-group-prepend">
        <button
          class="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ specifierType }}
        </button>
        <div class="dropdown-menu">
          <a
            class="dropdown-item"
            :class="{active: specifierType === 'Internal'}"
            href="javascript:;"
            @click="specifierType = 'Internal'"
          >
            Internal
          </a>
          <a
            class="dropdown-item"
            :class="{active: specifierType === 'External'}"
            href="javascript:;"
            @click="specifierType = 'External'"
          >
            External
          </a>
        </div>
      </div>
      <div class="input-group-prepend">
        <button
          class="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ specifierClassComputed }}
        </button>
        <div class="dropdown-menu">
          <!-- TODO: remove external reference as a type and add it in as a separate property. -->
          <a
            class="dropdown-item"
            :class="{active: specifierClassComputed === 'Taxon'}"
            href="javascript:;"
            @click="specifierClass = 'Taxon'"
          >
            Taxon
          </a>
          <a
            class="dropdown-item"
            :class="{active: specifierClassComputed === 'Specimen'}"
            href="javascript:;"
            @click="specifierClass = 'Specimen'"
          >
            Specimen
          </a>
          <a
            class="dropdown-item"
            :class="{active: specifierClassComputed === 'External reference'}"
            href="javascript:;"
            @click="specifierClass = 'External reference'"
          >
            External reference
          </a>
          <a
            class="dropdown-item"
            :class="{active: specifierClassComputed === 'Apomorphy'}"
            href="javascript:;"
            @click="specifierClass = 'Apomorphy'"
          >
            Apomorphy
          </a>
        </div>
      </div>
      <div class="input-group-prepend" v-if="specifierClassComputed === 'Taxon'">
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
            class="dropdown-item"
            v-for="(nomenCode, nomenCodeIndex) of nomenCodes"
            :class="{active: enteredNomenclaturalCode === nomenCode.uri }"
            href="javascript:;"
            @click="enteredNomenclaturalCode = nomenCode.uri"
          >
            {{ nomenCode.label }}
          </a>
        </div>
      </div>
      <input
        v-model="specifierLabel"
        type="text"
        class="form-control"
      >
      <div class="input-group-append">
        <button
          class="btn btn-outline-secondary"
          :class="{active: expand}"
          @click="expand = !expand"
        >
          {{ (expand) ? 'Collapse' : 'Expand' }}
        </button>
      </div>
      <div class="input-group-append">
        <button
          class="btn btn-danger"
          @click="deleteSpecifier()"
        >
          &times;
        </button>
      </div>
    </div>
    <div
      v-if="expand"
      class="card mt-1 mb-3"
    >
      <div class="card-body">
        <h5 class="card-title">
          Specifier details
        </h5>

        <!-- Verbatim specifier -->
        <div class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="verbatim-specifier"
          >
            Verbatim specifier
          </label>
          <div class="col-md-10 input-group">
            <input
              id="verbatim-specifier"
              v-model="specifierLabel"
              class="form-control"
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
              v-model="specifierClassComputed"
              class="form-control"
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
              <option value="Apomorphy">
                Apomorphy
              </option>
            </select>
          </div>
        </div>

        <!--
          We provide three different possible displays for the three different
          types here
        -->
        <template v-if="specifierClassComputed === 'Taxon'">
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
                v-model="enteredNomenclaturalCode"
                class="form-control"
              >
                <option
                  v-for="(nomenCode, nomenCodeIndex) of nomenCodes"
                  :value="nomenCode.uri"
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
                class="form-control"
                v-model="taxonNameWrapped.nameComplete"
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
                class="form-control"
                v-model="taxonNameWrapped.genusPart"
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
                class="form-control"
                v-model="taxonNameWrapped.specificEpithet"
              >
            </div>
          </div>

          <div class="form-group row" v-if="taxonNameWrapped.infraspecificEpithet">
            <label
              class="col-form-label col-md-2"
              for="infraspecific-epithet"
            >
              Infraspecific epithet
            </label>
            <div class="col-md-10 input-group">
              <input
                id="infraspecific-epithet"
                class="form-control"
                v-model="taxonNameWrapped.infraspecificEpithet"
              >
            </div>
          </div>
        </template>

        <template v-if="specifierClassComputed === 'Specimen'">
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="occurrence-id"
            >
              Occurrence ID
            </label>
            <div class="col-md-10 input-group">
              <input
                id="occurrence-id"
                v-model="enteredOccurrenceID"
                readonly
                class="form-control"
                placeholder="Enter the occurrence ID of the specimen here"
              >
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
                :value="specimenWrapped.institutionCode"
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
                :value="specimenWrapped.collectionCode"
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
                :value="specimenWrapped.catalogNumber"
              >
            </div>
          </div>
        </template>

        <template v-if="specifierClassComputed === 'External reference'">
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="external-reference"
            >
              External reference
            </label>
            <div class="col-md-10 input-group">
              <input
                id="external-reference"
                v-model="externalReference"
                class="form-control"
                placeholder="Enter URI of external reference here"
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

        <template v-if="specifierClassComputed === 'Apomorphy'">
          <p>
            Apomorphy-based specifiers are not currently supported. Please enter
            them into the verbatim label field for now.
          </p>
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

import Vue from 'vue';
import {
  PhylorefWrapper,
  TaxonomicUnitWrapper,
  TaxonConceptWrapper,
  TaxonNameWrapper,
  SpecimenWrapper,
} from '@phyloref/phyx';
import {
  has, isEmpty, isEqual, cloneDeep, pickBy,
} from 'lodash';

export default {
  name: 'Specifier',
  props: {
    remoteSpecifier: { /* The specifier to display and edit */
      type: Object,
      required: true,
    },
    phyloref: { /* The phyloreference containing this specifier */
      type: Object,
      required: true,
    },
  },
  data() {
    const taxonNameWrapped = new TaxonNameWrapper(cloneDeep(this.remoteSpecifier));

    return {
      expand: false,
      specifierClass: undefined,
      enteredVerbatimLabel: "",
      specimenWrapped: new SpecimenWrapper(cloneDeep(this.remoteSpecifier)),
      taxonNameWrapped,
      enteredNomenclaturalCode: taxonNameWrapped.nomenclaturalCode ||
        this.$store.getters.getDefaultNomenCodeURI,
    };
  },
  computed: {
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    nomenclaturalCodeObj() {
      return TaxonNameWrapper.getNomenCodeAsObject(this.enteredNomenclaturalCode) ||
        TaxonNameWrapper.getNomenCodeAsObject(TaxonNameWrapper.NAME_IN_UNKNOWN_CODE);
    },
    specifier() {
      // Check the specifierClass before we figure out how to construct the
      // specifier we might want to overwrite.
      let result;
      switch (this.specifierClassComputed) {
        case 'Taxon':
          result = TaxonConceptWrapper.fromLabel(
            this.enteredScientificName,
            this.enteredNomenclaturalCode
          );
          break;

        case 'Specimen':
          result = SpecimenWrapper.fromOccurrenceID(this.enteredOccurrenceID);
          break;
      }

      // Make sure we have a result, even if it's just a blank object.
      if(!result) result = {};

      // Add verbatimSpecifier.
      if (this.enteredVerbatimLabel) {
        result.label = this.enteredVerbatimLabel;
      }

      return new TaxonomicUnitWrapper(result);
    },
    specifierType: {
      get() {
        return new PhylorefWrapper(this.phyloref).getSpecifierType(this.remoteSpecifier);
      },
      set(type) {
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
    specifierLabel: {
      get() {
        return this.specifier.label;
      },
      set(label) {
        // 1. Set the verbatim specifier to this.
        this.enteredVerbatimLabel = label;

        // 2. Attempt to extract the specifier information from there.
        switch (this.specifierClassComputed) {
          case 'Taxon':
            this.enteredScientificName = label;
            this.enteredOccurrenceID = "";
            this.enteredExternalReference = "";
            break;

          case 'Specimen':
            this.enteredOccurrenceID = label;
            this.enteredScientificName = "";
            this.enteredExternalReference = "";
            break;

          case 'External reference':
            this.enteredExternalReference = label;
            this.enteredScientificName = "";
            this.enteredOccurrenceID = "";
            break;
        }

        // console.log('Specifier now at', this.specifier);
        this.updateSpecifier();
      },
    },
    specifierClassComputed: {
      get() {
        // Usually, this will be straightforward. However, an input JSON object might
        // be confused by having multiple kinds of specifier data. In that case, we
        // will pick the type in the following order:
        //  1. external reference (if external reference is filled in)
        //  2. specimen (if a specimen identifier is filled in)
        //  3. taxon (if scientificName is filled in)

        if (this.specifierClass) return this.specifierClass;

        const tunit = new TaxonomicUnitWrapper(this.remoteSpecifier);

        if ((tunit.externalReferences || []).length > 0) return 'External reference';
        if ((tunit.includesSpecimens || []).length > 0) return 'Specimen';
        if ((tunit.scientificNames || []).length > 0) return 'Taxon';

        // If all else fails, be a taxon.
        return 'Taxon';
      },
      set(type) {
        this.specifierClass = type;
        this.updateSpecifier();
      },
    },
    enteredScientificName: {
      // TODO: We should want the user if we couldn't parse this; at the moment,
      // we silently ignore this and no specifier gets written.
      get() {
        return this.taxonNameWrapped.nameComplete;
      },
      set(scname) {
        // Don't do anything if a scname is not actually set.
        if (!scname) return;

        this.taxonNameWrapped = new TaxonNameWrapper(TaxonNameWrapper.fromVerbatimName(scname, this.enteredNomenclaturalCode) || {});
        this.updateSpecifier();
      },
    },
    enteredOccurrenceID: {
      get() {
        return this.specimenWrapped.occurrenceID;
      },
      set(occurID) {
        this.specimenWrapped = new SpecimenWrapper(SpecimenWrapper.fromOccurrenceID(occurID));
        this.updateSpecifier();
      },
    }
  },
  watch: {
    phyloref() {
      this.recalculateEntered();
    },
    remoteSpecifier() {
      this.recalculateEntered();
    },
  },
  mounted() {
    this.recalculateEntered();
  },
  methods: {
    recalculateEntered() {
      console.log("Recalculating entered values: ", this.remoteSpecifier);

      // Recalculate the entered values.
      const tunit = new TaxonomicUnitWrapper(cloneDeep(this.remoteSpecifier || {}));

      const taxonConceptWrapped = new TaxonConceptWrapper(tunit.taxonConcept)
      if (taxonConceptWrapped && taxonConceptWrapped.taxonName) {
        this.taxonNameWrapped = new TaxonNameWrapper(taxonConceptWrapped.taxonName);
        this.enteredScientificName = this.taxonNameWrapped.nameComplete;
        this.enteredNomenclaturalCode = this.taxonNameWrapped.nomenclaturalCode ||
          this.$store.getters.getDefaultNomenCodeURI;
      }

      if (tunit.specimen) {
        this.specimenWrapped = new SpecimenWrapper(tunit.specimen);
        this.enteredOccurrenceID = this.specimenWrapped.occurrenceID;
      }

      // TODO: handle external references correctly.
      // TODO: what if all fail?
    },
    deleteSpecifier() {
      const confirmed = confirm('Are you sure you want to delete this specifier?');
      if (confirmed) {
        this.$store.commit('deleteSpecifier', {
          phyloref: this.phyloref,
          specifier: this.remoteSpecifier,
        });
      }
    },
    updateSpecifier() {
      const result = this.specifier;

      // If our local specifier differs from the remoteSpecifier, update it.
      if (isEqual(result, this.remoteSpecifier)) return;

      console.log('Updating specifier as ', result, ' differs from ', this.remoteSpecifier);
      this.$store.commit('setSpecifierProps', {
        specifier: this.remoteSpecifier,
        props: result,
      });
    },
  },
};
</script>

<style>
.hand-cursor {
  cursor: pointer;
}
</style>
