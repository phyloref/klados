<template>
  <div class="phylotreeContainer">
    <svg
      :id="uniqueId"
      class="col-md-12 phylogeny"
    />
    <resize-observer @notify="redrawTree()" />
  </div>
</template>

<script>
/*
 * Note that this requires the Phylotree Javascript to be loaded in the HTML
 * header: I haven't figured out how to include phylotree.js from within Vue CLI.
 */

export default {
  name: 'Phylotree',
  props: {
    newick: {
      type: String,
      default: '()',
    },
    spacingX: {
      type: Number,
      default: 20,
    },
    spacingY:  {
      type: Number,
      default: 20
    },
  },
  data () { return {
    uniqueId: _.uniqueId('phylotree-svg-'),
  }},
  computed: {
    newickAsString () { return this.newick; },
  },
  mounted () {
    this.redrawTree();
  },
  methods: {
    redrawTree () {
      // Set up Phylotree.
      const tree = d3.layout.phylotree()
        .svg(d3.select(`#${this.uniqueId}`))
        .options({
          'internal-names': true,
          transitions: false,
          'left-offset': 100, // So we have space to display a long label on the root node.
          'left-right-spacing': 'fit-to-size',
          'top-bottom-spacing': 'fixed-step',
        })
      tree(this.newick || '()');
      tree
        .size([
          // height
          0,
          // width
          $(`#${this.uniqueId}`).width()
        ])
        .spacing_x(this.spacingX)
        .spacing_y(this.spacingY)
        .update();
    },
  },
};
</script>

<style scoped>
.phylogeny {
  width: 100%;
}
.phylotreeContainer {
  /* Required for Vue-Resize to track its size */
  position: relative;
}
</style>