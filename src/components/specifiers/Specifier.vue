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
          {{ specifierClass }}
        </button>
        <div class="dropdown-menu">
          <!-- TODO: remove external reference as a type and add it in as a separate property. -->
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
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'Apomorphy'}"
            href="javascript:;"
            @click="specifierClass = 'Apomorphy'"
          >Apomorphy</a>
        </div>
      </div>
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
            :class="{active: enteredNomenclaturalCode === nomenCode.iri }"
            href="javascript:;"
            @click="enteredNomenclaturalCode = nomenCode.iri"
            :key="nomenCode.iri"
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
          <b-icon-trash></b-icon-trash>
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

        <!-- Specifier type: internal or external. Only applies to phylorefs! -->
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
                v-model.lazy="taxonNameWrapped.nameComplete"
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
                v-model="taxonNameWrapped.genusPart"
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
                v-model="taxonNameWrapped.specificEpithet"
                class="form-control"
              >
            </div>
          </div>

          <div
            v-if="taxonNameWrapped.infraspecificEpithet"
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
                v-model="taxonNameWrapped.infraspecificEpithet"
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
            <div class="col-md-10 input-group">
              <input
                id="occurrence-id"
                v-model="enteredOccurrenceID"
                class="form-control"
                placeholder="Enter the occurrence ID of the specimen here, e.g. 'MVZ:Herp:246033'"
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


// TaxonomicUnitWrapper doesn't yet set a type for apomophies, so
// we'll set one up ourselves.
TaxonomicUnitWrapper.TYPE_APOMORPHY = 'http://purl.obolibrary.org/obo/CDAO_0000071';

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
     *   property. This is specified in two ways: a phylogeny as well as a nodeLabel.
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
    // All of this will be filled in by mounted().
    return {
      expand: false,
      specifierClass: undefined,
      specimenWrapped: undefined,
      taxonNameWrapped: undefined,
      enteredNomenclaturalCode: this.$store.getters.getDefaultNomenCodeURI,
      enteredVerbatimLabel: undefined,
      externalReference: undefined,
    };
  },
  computed: {
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    nomenclaturalCodeObj() {
      return TaxonNameWrapper.getNomenCodeDetails(this.enteredNomenclaturalCode);
    },
    specifier() {
      // Check the specifierClass before we figure out how to construct the
      // specifier we might want to overwrite.
      let result;
      switch (this.specifierClass) {
        case 'Taxon':
          result = TaxonConceptWrapper.fromLabel(
            this.enteredScientificName,
            this.enteredNomenclaturalCode,
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
            '@id': this.externalReference || this.enteredVerbatimLabel || '',
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
    specifierLabel: {
      get() {
        if (this.enteredVerbatimLabel) return this.enteredVerbatimLabel;
        if (this.externalReference) return this.externalReference;
        if (this.specimenWrapped) return this.specimenWrapped.label;
        if (this.taxonNameWrapped) return this.taxonNameWrapped.label;
        return '';
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
              this.enteredNomenclaturalCode,
            );
            break;

          case 'Specimen':
            this.specimenWrapped = SpecimenWrapper.fromOccurrenceID(
              label,
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
        if (this.taxonNameWrapped) return this.taxonNameWrapped.nameComplete;
        return '';
      },
      set(scname) {
        // Don't do anything if a scname is not actually set.
        if (!scname) return;

        this.taxonNameWrapped = new TaxonNameWrapper(TaxonNameWrapper.fromVerbatimName(scname, this.enteredNomenclaturalCode) || {});
        this.updateSpecifier();
        this.enteredScientificName = scname;
      },
    },
    enteredOccurrenceID: {
      get() {
        if (this.specimenWrapped) return this.specimenWrapped.occurrenceID;
        return '';
      },
      set(occurID) {
        this.specimenWrapped = new SpecimenWrapper(SpecimenWrapper.fromOccurrenceID(occurID));
        this.updateSpecifier();
      },
    },
  },
  watch: {
    phyloref() {
      this.recalculateEntered();
    },
    phylogeny() {
      this.recalculateEntered();
    },
    nodeLabel() {
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
    },
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
      console.log('Recalculating entered values from: ', this.remoteSpecifier);

      // Recalculate the entered values.
      const tunit = new TaxonomicUnitWrapper(cloneDeep(this.remoteSpecifier || {}));

      // If it has an '@id', it is an external reference to that '@id'.
      if (has(this.remoteSpecifier, '@id')) {
        this.specifierClass = 'External reference';
        this.externalReference = this.remoteSpecifier['@id'];
        // tunit.label adds '<>s' around the @id. We work around that by trying
        // to read the label directly.
        this.enteredVerbatimLabel = this.remoteSpecifier.label || tunit.label;
      } else {
        this.enteredVerbatimLabel = tunit.label;
        this.specifierClass = this.getSpecifierClass(tunit) || 'Taxon';
      }

      const taxonConceptWrapped = new TaxonConceptWrapper(tunit.taxonConcept);
      if (taxonConceptWrapped && taxonConceptWrapped.taxonName) {
        this.taxonNameWrapped = new TaxonNameWrapper(taxonConceptWrapped.taxonName);
        this.enteredNomenclaturalCode = this.taxonNameWrapped.nomenclaturalCode
          || this.enteredNomenclaturalCode;
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
        if (this.phyloref) {
          console.log("Deleting specifier from phyloref: ", this.phyloref, this.remoteSpecifier);
          this.$store.commit('deleteSpecifier', {
            phyloref: this.phyloref,
            specifier: this.remoteSpecifier,
          });
        } else if (this.phylogeny && this.nodeLabel) {
          console.log("Deleting taxonomic unit from phylogeny: ", this.phylogeny, this.nodeLabel, this.remoteSpecifier);
          this.$store.commit('replaceTUnitForPhylogenyNode', {
            phyloref: this.phylogeny,
            nodeLabel: this.nodeLabel,
            tunit: this.remoteSpecifier,
            delete: true,
          });
        }
      }
    },
    updateSpecifier() {
      const result = this.specifier;

      // If our local specifier differs from the remoteSpecifier, update it.
      if (this.$store.getters.areTUnitsIdentical(result, this.remoteSpecifier))
        return;

      if (this.phyloref) {
        console.log('Updating specifier in ', phyloref, ' as ', result, ' differs from ', this.remoteSpecifier);
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
        console.error("Specifier has neither phyloref nor phylogeny/nodeLabel combination: ", data);
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
