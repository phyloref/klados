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
import { isEqual } from 'lodash';

export default {
  name: 'ModifiedIcon',
  props: {
    message: {
      type: String,
      default: "This element has changed! Please remember to save it.",
    },
    compare: Object,
    compareTo: Object,
  },
  computed: {
    dataChanged: function () { return !isEqual(this.compare, this.compareTo); },
  },
};
</script>
