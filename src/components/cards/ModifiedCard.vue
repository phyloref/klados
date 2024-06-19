<template>
  <div v-if="dataChanged" class="card mb-2 border-dark">
    <div class="card-body bg-warning">
      {{ message }}
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

import { isEqual } from "lodash";
import { PhylogenyWrapper, PhylorefWrapper, PhyxWrapper } from "@phyloref/phyx";

export default {
  name: "ModifiedCard",
  props: {
    message: {
      type: String,
      default: "This element has changed! Please remember to save it.",
    },
    compare: Object /* Object to check for changes. */,
    compareTo:
      Object /* Changes will be determined by comparing this to this.compare */,
    normalizeAs: {
      type: String,
      default: "none",
    },
  },
  computed: {
    dataChanged() {
      if (this.normalizeAs === "phyx")
        return !isEqual(
          PhyxWrapper.normalize(this.compare),
          PhyxWrapper.normalize(this.compareTo)
        );
      else if (this.normalizeAs === "phyloref")
        return !isEqual(
          PhylorefWrapper.normalize(this.compare),
          PhylorefWrapper.normalize(this.compareTo)
        );
      else if (this.normalizeAs === "phylogeny")
        return !isEqual(
          PhylogenyWrapper.normalize(this.compare),
          PhylogenyWrapper.normalize(this.compareTo)
        );
      return !isEqual(this.compare, this.compareTo);
    },
  },
};
</script>
