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
import { isEqual } from 'lodash';

export default {
  name: 'ModifiedCard',
  props: {
    message: {
      type: String,
      default: "This element has changed! Please remember to save it."
    },
    compare: Object,
    compareTo: Object,
  },
  computed: {
    dataChanged: function () { return !isEqual(this.compare, this.compareTo); },
  },
};
</script>
