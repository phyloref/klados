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
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'Taxon'}" href="javascript:;" @click="specifierClass = 'Taxon'">Taxon</a>
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'Specimen'}"  href="javascript:;" @click="specifierClass = 'Specimen'">Specimen</a>
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'External reference'}"  href="javascript:;" @click="specifierClass = 'External reference'">External reference</a>
          <a class="dropdown-item" :class="{active: specifierClassComputed === 'Apomorphy'}"  href="javascript:;" @click="specifierClass = 'Apomorphy'">Apomorphy</a>
        </div>
      </div>
      <input
        type="text"
        class="form-control"
        v-model:lazy="specifierLabel"
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
          <div class="col-md-10">
            <input
              id="verbatim-specifier"
              v-model:lazy="specifier.verbatimSpecifier"
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
  ScientificNameWrapper,
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
        return this.specifier.verbatimSpecifier || PhylorefWrapper.getSpecifierLabel(this.specifier);
      },
      set(label) {
        // 1. Set the verbatim specifier to this.
        Vue.set(this.specifier, 'verbatimSpecifier', label);

        // 2. Attempt to extract the specifier information from there.
        switch (this.specifierClassComputed) {
          case 'Taxon':
            Vue.set(this.specifier, 'referencesTaxonomicUnits', {
              scientificNames: [
                ScientificNameWrapper.createFromVerbatimName(label),
              ],
            });
            break;
          case 'Specimen':
            Vue.set(this.specifier, 'referencesTaxonomicUnits', {
              includesSpecimens: [
                SpecimenWrapper.createFromOccurrenceID(label),
              ]
            });
            break;
          case 'External reference':
            Vue.set(this.specifier, 'referencesTaxonomicUnits', [{
              externalReferences: [label],
            }]);
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
        const tunit = new TaxonomicUnitWrapper(this.specifier.referencesTaxonomicUnits || []);

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
  },
  watch: {
    specifier() {
      this.updateSpecifier();
    },
  },
  methods: {
    updateSpecifier() {
      // If our local specifier differs from the remoteSpecifier, update it.
      if (isEqual(this.specifier, this.remoteSpecifier)) return;

      console.log('Updating specifier as ', this.specifier, ' differs from ', this.remoteSpecifier);
      this.$store.commit('setSpecifierProps', {
        specifier: this.remoteSpecifier,
        props: this.specifier,
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
