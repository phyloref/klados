<template>
  <div
    v-if="dataChanged"
    class="float-right"
    :title="message"
  >
    <font-awesome-icon
      size="lg"
      icon="exclamation-circle"
    />
  </div>
</template>

<script>
/*
 * Creates an icon with a warning if a variable has changed in value as compared
 * to a comparison object. The icon is floated to the right and will display the
 * specified message if you hover over it.
 *
 */

import { isEqual } from 'lodash';

export default {
  name: 'ModifiedIcon',
  props: {
    message: {
      type: String,
      default: 'This element has changed! Please remember to save it.',
    },
    compare: Object, /* Object to check for changes. */
    compareTo: Object, /* Changes will be determined by comparing this to this.compare */
  },
  computed: {
    dataChanged() { return !isEqual(this.compare, this.compareTo); },
  },
};
</script>
