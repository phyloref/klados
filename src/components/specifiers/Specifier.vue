<template>
  <div class="col-md-12">
    <div class="input-group mb-1">
      <div class="input-group-prepend">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{ specifierType }}
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" :class="{active: specifierType === 'Internal'}" href="javascript:;" @click="specifierType = 'Internal'">Internal</a>
          <a class="dropdown-item" :class="{active: specifierType === 'External'}" href="javascript:;" @click="specifierType = 'External'">External</a>
        </div>
      </div>
      <div class="input-group-prepend">
        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {{ specifierClassComputed }}
        </button>
        <div class="dropdown-menu">
          <!-- TODO: remove external reference as a type and add it in as a separate property. -->
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'Taxon'}" href="javascript:;" @click="specifierClass = 'Taxon'">Taxon</a>
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'Specimen'}"  href="javascript:;" @click="specifierClass = 'Specimen'">Specimen</a>
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'External reference'}"  href="javascript:;" @click="specifierClass = 'External reference'">External reference</a>
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'Apomorphy'}"  href="javascript:;" @click="specifierClass = 'Apomorphy'">Apomorphy</a>
        </div>
      </div>
      <input
        type="text"
        class="form-control"
        v-model="specifierLabel"
      />
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
              v-model="specifier.verbatimSpecifier"
              class="form-control"
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
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="scientific-name"
            >
              Scientific name
            </label>
            <div class="col-md-10 input-group">
              <input
                class="form-control"
                id="scientific-name"
                placeholder="Enter the scientific name"
                v-model="scientificName"
              />
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="binomial-name"
            >
              Binomial name
            </label>
            <div class="col-md-10 input-group">
              <input
                readonly
                class="form-control"
                id="binomial-name"
                :value="scientificNameWrapper.binomialName"
              />
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
                readonly
                class="form-control"
                id="genus"
                :value="scientificNameWrapper.genus"
              />
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
                readonly
                class="form-control"
                id="specific-epithet"
                :value="scientificNameWrapper.specificEpithet"
              />
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
                readonly
                class="form-control"
                id="occurrence-id"
                placeholder="Enter the occurrence ID of the specimen here"
                v-model="enteredOccurrenceID"
              />
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
                readonly
                class="form-control"
                id="collection-code"
                :value="specimenWrapper.institutionCode"
              />
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
                readonly
                class="form-control"
                id="collection-code"
                :value="specimenWrapper.collectionCode"
              />
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
                readonly
                class="form-control"
                id="catalog-number"
                :value="specimenWrapper.catalogNumber"
              />
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
                class="form-control"
                id="external-reference"
                placeholder="Enter URI of external reference here"
                v-model="externalReference"
              />
              <div class="input-group-append">
                <a class="btn btn-outline-secondary" target="_blank" :href="externalReference">Open in new window</a>
              </div>
            </div>
          </div>
        </template>

        <template v-if="specifierClassComputed === 'Apomorphy'">
          <p>Apomorphy-based specifiers are not currently supported. Please enter
          them into the verbatim label field for now.</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * Displays a specifier as a textfield/expanded field.
 * Both the textfield and the expanded fields are editable, and will overwrite each other as we go.
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
    return {
      specifier: cloneDeep(this.remoteSpecifier),
      expand: false,
      specifierClass: undefined,
      enteredOccurrenceID: "",
      enteredScientificName: "",
      enteredExternalReference: "",
    };
  },
  computed: {
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
            specifierType: type
          }
        );
      },
    },
    specifierLabel: {
      get() {
        // Return the verbatim specifier OR the specifier label.
        return this.specifier.verbatimSpecifier || new TaxonomicUnitWrapper(this.specifier).label;
      },
      set(label) {
        // 1. Set the verbatim specifier to this.
        Vue.set(this.specifier, 'verbatimSpecifier', label);

        // 2. Attempt to extract the specifier information from there.
        switch (this.specifierClassComputed) {
          case 'Taxon':
            this.enteredScientificName = label;
            break;

          case 'Specimen':
            this.enteredOccurrenceID = label;
            break;

          case 'External reference':
            this.enteredExternalReference = label;
            break;
        }

        console.log("Specifier now at", this.specifier);
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

        if(this.specifierClass) return this.specifierClass;

        // TODO: remove hack once we move to Model 2.0.
        const tunit = new TaxonomicUnitWrapper(this.specifier || {});

        if((tunit.externalReferences || []).length > 0) return "External reference";
        if((tunit.includesSpecimens || []).length > 0) return "Specimen";
        if((tunit.scientificNames || []).length > 0) return "Taxon";

        // If all else fails, be a taxon.
        return "Taxon";
      },
      set(type) {
        this.specifierClass = type;
        this.updateSpecifier();
      }
    },
    scientificName: {
      get() {
        return this.enteredScientificName;
      },
      set(scname) {
        Vue.set(this, 'specifier', TaxonConceptWrapper.fromLabel(scname));
        this.updateSpecifier();
        this.enteredScientificName = scname;
      }
    },
    scientificNameWrapper() {
      return new TaxonNameWrapper(TaxonNameWrapper.fromVerbatimName(this.enteredScientificName));
    },
    specimenWrapper() {
      return new SpecimenWrapper(SpecimenWrapper.createFromOccurrenceID(this.enteredOccurrenceID));
    },
  },
  mounted() {
    this.recalculateEntered();
  },
  watch: {
    remoteSpecifier() {
      this.recalculateEntered();
    },
    specifier() {
      this.updateSpecifier();
    },
  },
  methods: {
    recalculateEntered() {
      // Recalculate the entered values.
      const tunit = new TaxonomicUnitWrapper(this.specifier || {});

      if (tunit.types.includes(TaxonomicUnitWrapper.TYPE_SPECIMEN)) {
        this.enteredOccurrenceID = tunit.label;
      } else  if (tunit.types.includes(TaxonomicUnitWrapper.TYPE_TAXON_CONCEPT)) {
        this.enteredScientificName = tunit.label;
      } else {
        // No idea what this is! Let's assume it's a scientific name.
        this.enteredScientificName = tunit.label;
      }
    },
    deleteSpecifier() {
      const confirmed = confirm("Are you sure you want to delete this specifier?");
      if (confirmed) {
        this.$store.commit('deleteSpecifier', {
          phyloref: this.phyloref,
          specifier: this.remoteSpecifier
        });
      }
    },
    updateSpecifier() {
      // Check the specifierClass before we figure out how to construct the
      // specifier we might want to overwrite.
      let result;
      switch(this.specifierClassComputed) {
        case 'Taxon':
          result = TaxonConceptWrapper.fromLabel(this.enteredScientificName);
          break;

        case 'Specimen':
          result = SpecimenWrapper.fromOccurrenceID(this.enteredOccurrenceID);
          break;
      }

      // Add verbatimSpecifier.
      if (has(this.specifier, 'verbatimSpecifier')) {
        result.verbatimSpecifier = this.specifier.verbatimSpecifier;
      }

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
