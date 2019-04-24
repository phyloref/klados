<template>
  <div class="form-group row">
    <label class="col-form-label col-md-2">
      {{label}}
    </label>
    <div class="col-md-10">
      <template v-if="citations.length === 0">
        <a href="javascript:;" @click="citations.push({})">Add citation</a>
      </template>
      <template v-for="(citation, citationIndex) of citations">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Citation" :value="asText(citation)">
          <div class="input-group-append">
            <a class="btn btn-secondary" @click="toggleCitationExpanded(citationIndex)" href="javascript:;">Expand</a>
          </div>
        </div>
        <div class="card mt-1" v-if="citationsExpanded.includes(citationIndex)">
          <div class="card-body">
            <h5 class="card-title">Citation details</h5>
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="doi">DOIs (one per line)</label>
              <div class="input-group col-md-10">
                <textarea id="doi" rows="3" class="form-control"
                  placeholder="Enter DOIs here"
                  :value="wrappedCitation(citation).dois.join('\n')"
                  @change="setDOIs(citation, $event.target.value.split(/\s*\n\s*/))"
                ></textarea>
                <div class="input-group-append">
                  <a class="btn btn-outline-secondary" target="_blank"
                    :href="'http://doi.org/' + wrappedCitation(citation).firstDOI"
                    :class="{disabled: !wrappedCitation(citation).firstDOI}"
                    >Open in new window</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
/*
 * Displays a citation as a textfield/expanded field.
 */

import Vue from 'vue';
import { has, isEmpty, isEqual, cloneDeep } from 'lodash';

export default {
  name: 'Citation',
  props: {
    label: { /* The label for this citation */
      type: String,
      default: 'Citation',
    },
    object: { /* The object containing the citation to display and edit */
      type: Object,
      required: true,
    },
    citationKey: { /* The key on the object containing the citation to display and edit */
      type: String,
      required: true
    }
  },
  data() {
    return {
      // Which citations have been expanded (by index).
      citationsExpanded: [],

      // Copy of the citations provided to this component.
      citations: cloneDeep(this.object[this.citationKey] || []),

      // Items used to store new items.
      newDOI: "",
    };
  },
  watch: {
    citations() {
      console.log('citations()');

      // If our citations change, we should reflect them back to the
      // original object.
      if (isEmpty(this.citations)) return;
      if (isEqual(this.citations, this.object[this.citationKey])) return;

      console.log('setCitations:', this.object, this.citationKey, this.citations);

      this.$store.commit('setCitations', {
        object: this.object,
        citationKey: this.citationKey,
        citations: this.citations,
      })
    },
  },
  methods: {
    toggleCitationExpanded(citationIndex) {
      console.log('Checking', citationIndex, 'against', this.citationsExpanded);

      if (this.citationsExpanded.includes(citationIndex))
        this.citationsExpanded = this.citationsExpanded.filter(index => index !== citationIndex);
      else
        this.citationsExpanded.push(citationIndex);

      console.log('Now at', this.citationsExpanded);
    },
    wrappedCitation(citation) {
      return this.$store.getters.getWrappedCitation(citation);
    },
    asText(citation) {
      return this.$store.getters.getWrappedCitation(citation).toString();
    },
    doisFor(citation) {
      return this.$store.getters.getWrappedCitation(citation).dois;
    },
    setDOIs(citation, dois) {
      console.log("Setting citation", citation, "to DOIs", dois);
      Vue.set(citation, 'identifier', dois.map(doi => { return { type: 'doi', id: doi }; }));
      console.log("Citations now at:", this.citations);
    },
  }
};
</script>
