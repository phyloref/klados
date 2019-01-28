<template>
  <span>
    {{specifierAsHTML}}
  </span>
</template>

<script>
/*
 * Displays the label for a specifier.
 */

import { PhylorefWrapper } from 'phyx.js';
import { has } from 'lodash';

export default {
  name: 'SpecifierLabel',
  props: {
    specifier: Object,
  },
  computed: {
    specifierAsHTML () {
      return PhylorefWrapper.getSpecifierLabel(this.specifier);
    },
  },
};
</script>
