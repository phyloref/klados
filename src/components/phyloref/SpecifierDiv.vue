<template>
  <div>
    <strong>{{type}}:</strong> <SpecifierLabel :specifier="specifierObj" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import SpecifierLabel from './SpecifierLabel.vue';

export default {
  name: 'SpecifierDiv',
  components: { SpecifierLabel },
  props: {
    type: {
      type: String,
      default: "Unknown specifier type",
    },
    specifier: Object,
  },
  computed: {
    specifierObj () { return this.specifier; },
  },
};
</script>
