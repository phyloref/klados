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
          <input type="text" disabled class="form-control" placeholder="Citation" :value="wrappedCitation(citation).toString()">
          <div class="input-group-append">
            <a class="btn btn-secondary" @click="toggleCitationExpanded(citationIndex)" href="javascript:;">Expand</a>
          </div>
        </div>
        <div class="card mt-1" v-if="citationsExpanded.includes(citationIndex)">
          <div class="card-body">
            <h5 class="card-title">Citation details</h5>
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="authors">Authors (one per line)</label>
              <div class="col-md-10">
                <textarea id="authors" rows="3" class="form-control"
                  placeholder="Enter authors here"
                  :value="wrappedCitation(citation).authorsAsStrings.join('\n')"
                  @change="wrappedCitation(citation).authorsAsStrings = $event.target.value.split(/\s*\n\s*/); updateCitations();"
                ></textarea>
              </div>
            </div>
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="title">Title</label>
              <div class="col-md-10">
                <input id="title" type="text" class="form-control"
                  placeholder="Enter title here"
                  v-model="citation.title"
                  @change="updateCitations()"
                />
              </div>
            </div>
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="doi">DOIs (one per line)</label>
              <div class="col-md-10">
                <div class="input-group">
                  <textarea id="doi" rows="1" class="form-control"
                    placeholder="Enter DOIs here"
                    :value="wrappedCitation(citation).dois.join('\n')"
                    @change="setDOIs(citation, $event.target.value.split(/\s*\n\s*/))"
                  ></textarea>
                  <div class="input-group-append">
                    <a class="btn btn-outline-secondary align-middle" target="_blank" style="vertical-align: middle"
                      :href="'http://doi.org/' + wrappedCitation(citation).firstDOI"
                      :class="{disabled: !wrappedCitation(citation).firstDOI}"
                      >Open in new window</a>
                  </div>
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
      this.updateCitations();
    },
  },
  methods: {
    updateCitations() {
      // If our citations have changed, update the state of the citation they
      // point to.
      if (isEmpty(this.citations)) return;
      if (isEqual(this.citations, this.object[this.citationKey])) return;

      this.$store.commit('setCitations', {
        object: this.object,
        citationKey: this.citationKey,
        citations: this.citations,
      })
    },
    toggleCitationExpanded(citationIndex) {
      // Given the index of a citation, either expand it or collapse it.
      // (The citation is expanded if its index is in the citationsExpanded list)
      if (this.citationsExpanded.includes(citationIndex))
        this.citationsExpanded = this.citationsExpanded.filter(index => index !== citationIndex);
      else
        this.citationsExpanded.push(citationIndex);
    },
    wrappedCitation(citation) {
      // Return the citation
      return this.$store.getters.getWrappedCitation(citation);
    },
    setDOIs(citation, dois) {
      console.log("Setting citation", citation, "to DOIs", dois);
      Vue.set(citation, 'identifier', dois.map(doi => { return { type: 'doi', id: doi }; }));
      updateCitations();
    },
  }
};
</script>
