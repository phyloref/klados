<template>
  <div>
    <div class="input-group" v-for="citation of citations">
      <input type="text" class="form-control" placeholder="Citation" :value="asText(citation)">
      <div class="input-group-append">
        <a class="btn btn-outline-secondary" target="_blank" :href="doiFor(citation)" :disabled="!doiFor(citation)">Open in new window</a>
      </div>
    </div>R
  </div>
</template>

<script>
/*
 * Displays a citation as a textfield/expanded field.
 */

import { has, isEmpty } from 'lodash';

export default {
  name: 'Citation',
  props: {
    citations: { /* The citations to display and edit */
      type: Array,
      required: true,
    },
  },
  methods: {
    asText(citation) {
      // console.log(asCite(citation).format('data'));
      // return asCite(citation).format('citation');
      return '';
    },
    doiFor(citation) {
      //return citation['bibo:doi'] || undefined;
      return '';
    }
  }
};
</script>
