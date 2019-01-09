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
import { _ } from 'underscore';

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
    dataChanged: function () { return !_.isEqual(this.compare, this.compareTo); },
  },
};
</script>
