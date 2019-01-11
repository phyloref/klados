<template>
  <span>
    {{specifierAsHTML}}
  </span>
</template>

<script>
import { has } from 'lodash';

export default {
  name: 'SpecifierLabel',
  props: {
    specifier: Object,
  },
  computed: {
    specifierAsHTML () {
      if (this.specifier === undefined) return "(undefined)";
      // TODO: for now, we support old-style specifiers that contain multiple
      // taxonomic units. However, we're moving to a model where a specifier
      // is a single taxonomic unit. Therefore, we'll hackily support one before
      // permanently shifting to the new model.
      return this.specifier.referencesTaxonomicUnits.map((tunit) => {
        if (has(tunit, 'scientificNames')) {
          return tunit.scientificNames.map(scname => scname.scientificName).join(' or ');
        } else if(has(tunit, 'specimens')) {
          return tunit.specimens.map(specimen => specimen.specimenIdentifier).join(' or ');
        } else if(has(tunit, 'externalReferences')) {
          return tunit.externalReferences.map(extref => extref['@id']).join(' or ');
        } else {
          return "(empty taxonomic units)";
        }
      }).join("; ");
    },
  },
};
</script>
