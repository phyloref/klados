<template>
  <div class="col-md-12">
    <div class="input-group mb-1">
      <div class="input-group-prepend">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{ specifierClass }}
        </button>
        <div class="dropdown-menu">
          <!-- TODO: remove external reference as a type and add it in as a separate property. -->
          <a class="dropdown-item" :class="{active: specifierClass === 'Taxon'}" href="javascript:;" @click="specifierClass = 'Taxon'">Taxon</a>
          <a class="dropdown-item" :class="{active: specifierClass === 'Specimen'}"  href="javascript:;" @click="specifierClass = 'Specimen'">Specimen</a>
          <a class="dropdown-item" :class="{active: specifierClass === 'External reference'}"  href="javascript:;" @click="specifierClass = 'External reference'">External reference</a>
          <a class="dropdown-item" :class="{active: specifierClass === 'Apomorphy'}"  href="javascript:;" @click="specifierClass = 'Apomorphy'">Apomorphy</a>
        </div>
      </div>
      <div class="input-group-prepend" v-if="specifierClass === 'Taxon'">
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
        type="text"
        class="form-control"
        v-model="specifierLabel"
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

        <!-- Specifier type: internal or external -->
        <div class="form-group row">
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

        <!-- Verbatim specifier -->
        <div class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="verbatim-specifier"
          >
            Verbatim specifier
          </label>
          <div class="col-md-10">
            <input
              id="verbatim-specifier"
              v-model="enteredVerbatimLabel"
              class="form-control"
              @change="updateSpecifier()"
            />
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
                v-model.lazy="taxonNameWrapped.nameComplete"
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

        <template v-if="specifierClass === 'Specimen'">
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

        <template v-if="specifierClass === 'External reference'">
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

        <template v-if="specifierClass === 'Apomorphy'">
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
  has, isEmpty, isEqual, cloneDeep, pickBy, uniqueId,
} from 'lodash';

// TaxonomicUnitWrapper doesn't yet set a type for apomophies, so
// we'll set one up ourselves.
TaxonomicUnitWrapper.TYPE_APOMORPHY = 'http://purl.obolibrary.org/obo/CDAO_0000071';

export default {
  name: 'Specifier',
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
    phyloref: { /* The phyloreference containing this specifier */
      type: Object,
      required: true,
    },
  },
  data() {
    // All of this will be filled in by mounted().
    return {
      expand: false,
      specifierClass: undefined,
      specimenWrapped: undefined,
      taxonNameWrapped: undefined,
      enteredNomenclaturalCode: undefined,
      enteredVerbatimLabel: undefined,
      externalReference: undefined,
    };
  },
  computed: {
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    nomenclaturalCodeObj() {
      return TaxonNameWrapper.getNomenCodeAsObject(this.enteredNomenclaturalCode || TaxonNameWrapper.NAME_IN_UNKNOWN_CODE);
    },
    specifier() {
      // Check the specifierClass before we figure out how to construct the
      // specifier we might want to overwrite.
      let result;
      switch (this.specifierClass) {
        case 'Taxon':
          result = TaxonConceptWrapper.fromLabel(
            this.enteredScientificName,
            this.enteredNomenclaturalCode
          );
          break;

        case 'Specimen':
          result = SpecimenWrapper.fromOccurrenceID(this.enteredOccurrenceID);
          break;

        case 'Apomorphy':
          result = {
            '@type': TaxonomicUnitWrapper.TYPE_APOMORPHY,
          };
          break;

        case 'External reference':
          result = {
            // We store the external reference in the '@id' field.
            '@id': this.externalReference || this.enteredVerbatimLabel || "",
          };
          break;

        default:
          // Make sure we have a result, even if it's just a blank object.
          result = {};
      }

      // Add the entered verbatim label.
      if (this.enteredVerbatimLabel) {
        result.label = this.enteredVerbatimLabel;
      }

      return result;
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
        if (this.enteredVerbatimLabel) return this.enteredVerbatimLabel;
        if (this.externalReference) return this.externalReference;
        if (this.specimenWrapped) return this.specimenWrapped.label;
        if (this.taxonNameWrapped) return this.taxonNameWrapped.label;
        return "";
      },
      set(label) {
        // 1. Set the verbatim label to this.
        this.enteredVerbatimLabel = label;

        // 2. Attempt to extract the specifier information from there.
        switch (this.specifierClass) {
          case 'Taxon':
            // Try to extract a taxon name from this.
            this.taxonNameWrapped = TaxonNameWrapper.fromVerbatimName(
              label,
              this.enteredNomenclaturalCode
            );
            break;

          case 'Specimen':
            this.specimenWrapped = SpecimenWrapper.fromOccurrenceID(
              label
            );
            break;

          case 'Apomorphy':
            // For now, we just write apomorphies into the verbatim label.
            break;

          case 'External reference':
            this.externalReference = label;
            break;
        }

        this.updateSpecifier();
      },
    },
    enteredScientificName: {
      // TODO: We should want the user if we couldn't parse this; at the moment,
      // we silently ignore this and no specifier gets written.
      get() {
        if(this.taxonNameWrapped) return this.taxonNameWrapped.nameComplete;
        return "";
      },
      set(scname) {
        // Don't do anything if a scname is not actually set.
        if (!scname) return;

        this.taxonNameWrapped = new TaxonNameWrapper(TaxonNameWrapper.fromVerbatimName(scname, this.enteredNomenclaturalCode) || {});
        this.updateSpecifier();
        this.enteredScientificName = scname;
      }
    },
    enteredOccurrenceID: {
      get() {
        if(this.specimenWrapped) return this.specimenWrapped.occurrenceID;
        return "";
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
    remoteSpecifierId() {
      this.recalculateEntered();
    },
    specifierClass() {
      // If this changes we need to update the specifier!
      this.updateSpecifier();
    }
  },
  mounted() {
    this.recalculateEntered();
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

          case TaxonomicUnitWrapper.TYPE_APOMORPHY:
            return 'Apomorphy';
        }

        // If it has an '@id', it is an external reference to that '@id'.
        if (has(tunit, '@id')) {
          return 'External reference';
        }
      }

      return undefined;
    },
    recalculateEntered() {
      console.log("Recalculating entered values from: ", this.remoteSpecifier);

      // Set some defaults.
      this.enteredNomenclaturalCode = this.$store.getters.getDefaultNomenCodeURI;

      // Recalculate the entered values.
      const tunit = new TaxonomicUnitWrapper(cloneDeep(this.remoteSpecifier || {}));

      // If it has an '@id', it is an external reference to that '@id'.
      if (has(this.remoteSpecifier, '@id')) {
        this.specifierClass = 'External reference';
        this.externalReference = this.remoteSpecifier['@id'];
        // tunit.label adds '<>s' around the @id. We work around that by trying
        // to read the label directly.
        this.enteredVerbatimLabel = this.remoteSpecifier['label'] || tunit.label;
      } else {
        this.enteredVerbatimLabel = tunit.label;
        this.specifierClass = this.getSpecifierClass(tunit) || 'Taxon';
      }

      const taxonConceptWrapped = new TaxonConceptWrapper(tunit.taxonConcept)
      if (taxonConceptWrapped && taxonConceptWrapped.taxonName) {
        this.taxonNameWrapped = new TaxonNameWrapper(taxonConceptWrapped.taxonName);
        this.enteredNomenclaturalCode = this.taxonNameWrapped.nomenclaturalCode;
      }

      if (tunit.specimen) {
        this.specimenWrapped = new SpecimenWrapper(tunit.specimen);
      }

      // TODO: what if all fail?
    },
    deleteSpecifier() {
      // Update remoteSpecifier to what we've got currently entered.
      const confirmed = confirm('Are you sure you want to delete this specifier?');
      if (confirmed) {
        console.log("Deleting specifier: ", this.phyloref, this.remoteSpecifier);
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
