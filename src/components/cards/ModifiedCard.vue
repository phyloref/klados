<template>
  <div
    v-if="dataChanged"
    class="card mb-2 border-dark"
  >
    <div class="card-header bg-warning">Warning!</div>
    <div class="card-body">
      {{message}}
    </div>
  </div>
</template>

<script>
/*
 * Creates a card with a warning if a variable has changed in value as compared
 * to a comparison object.
 *
 * If/when we need to create more kinds of warning cards, we'll probably spin
 * that off as its own component.
 */

import { isEqual } from 'lodash';

export default {
  name: 'ModifiedCard',
  props: {
    message: {
      type: String,
      default: "This element has changed! Please remember to save it.",
    },
    compare: Object, /* Object to check for changes. */
    compareTo: Object, /* Changes will be determined by comparing this to this.compare */
  },
  computed: {
    dataChanged () { return !isEqual(this.compare, this.compareTo); },
  },
};
</script>
