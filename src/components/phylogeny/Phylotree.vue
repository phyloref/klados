<template>
  <div>
    <template v-if="newickError">
      <p>
        <strong>Error parsing phylogeny.</strong>
        Please
        <a href="javascript: void" @click="$store.commit('changeDisplay', {phylogeny})">edit the phylogeny</a>
        to fix this error.
      </p>
    </template>
    <div v-else class="phylotreeContainer">
      <svg
        :id="uniqueId"
        class="col-md-12 phylogeny"
      />
      <resize-observer @notify="redrawTree()" />
    </div>
  </div>
</template>

<script>
import { uniqueId, has } from 'lodash';

/*
 * Note that this requires the Phylotree Javascript to be loaded in the HTML
 * header: I haven't figured out how to include phylotree.js from within Vue CLI.
 */

export default {
  name: 'Phylotree',
  props: {
    phylogeny: Object,
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
    uniqueId: uniqueId('phylotree-svg-'),
  }},
  computed: {
    newickAsString () { return this.newick; },
    parsedNewick () {
      return d3.layout.newick_parser(this.newick);
    },
    newickErrors () {
      // Check to see if the newick could actually be parsed.
      if (!has(this.parsedNewick, 'json') || this.parsedNewick.json === null) {
        return (has(this.parsedNewick, 'error') ? this.parsedNewick.error : 'unknown error');
      }
      return undefined;
    },
    tree () {
      // Set up Phylotree.
      const tree = d3.layout.phylotree()
        .svg(d3.select(`#${this.uniqueId}`))
        .options({
          'internal-names': true,
          transitions: false,
          'left-offset': 100, // So we have space to display a long label on the root node.
          'left-right-spacing': 'fit-to-size',
          'top-bottom-spacing': 'fixed-step',
        });
      tree(this.newick || '()');
      return tree;
    },
  },
  mounted () {
    // Redraw the tree.
    this.redrawTree();
  },
  methods: {
    redrawTree () {
      this.tree
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

<style>
.phylogeny {
  width: 100%;
}
.phylotreeContainer {
  /* Required for Vue-Resize to track its size */
  position: relative;
}

/*
 * The following code is stolen from Bootstrap 3.3, which is a Phylotree.js
 * dependency. Since we otherwise use Bootstrap 4+, we need to override this
 * here so the menu works.
 *
 * We apply it only to subclasses of #d3_layout_phylotree_context_menu to limit
 * their fallout on other elements.
 */
#d3_layout_phylotree_context_menu.dropdown-menu {
 position: absolute;
 top: 100%;
 left: 0;
 z-index: 1000;
 display: none;
 float: left;
 min-width: 160px;
 padding: 5px 0;
 margin: 2px 0 0;
 font-size: 14px;
 text-align: left;
 list-style: none;
 background-color: #fff;
 -webkit-background-clip: padding-box;
         background-clip: padding-box;
 border: 1px solid #ccc;
 border: 1px solid rgba(0, 0, 0, .15);
 border-radius: 4px;
 -webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, .175);
         box-shadow: 0 6px 12px rgba(0, 0, 0, .175);
}
#d3_layout_phylotree_context_menu.dropdown-menu.pull-right {
 right: 0;
 left: auto;
}
#d3_layout_phylotree_context_menu.dropdown-menu .divider {
 height: 1px;
 margin: 9px 0;
 overflow: hidden;
 background-color: #e5e5e5;
}
#d3_layout_phylotree_context_menu.dropdown-menu > li > a {
 display: block;
 padding: 3px 20px;
 clear: both;
 font-weight: normal;
 line-height: 1.42857143;
 color: #333;
 white-space: nowrap;
}
#d3_layout_phylotree_context_menu.dropdown-menu > li > a:hover,
#d3_layout_phylotree_context_menu.dropdown-menu > li > a:focus {
 color: #262626;
 text-decoration: none;
 background-color: #f5f5f5;
}
#d3_layout_phylotree_context_menu.dropdown-menu > .active > a,
#d3_layout_phylotree_context_menu.dropdown-menu > .active > a:hover,
#d3_layout_phylotree_context_menu.dropdown-menu > .active > a:focus {
 color: #fff;
 text-decoration: none;
 background-color: #337ab7;
 outline: 0;
}
#d3_layout_phylotree_context_menu.dropdown-menu > .disabled > a,
#d3_layout_phylotree_context_menu.dropdown-menu > .disabled > a:hover,
#d3_layout_phylotree_context_menu.dropdown-menu > .disabled > a:focus {
 color: #777;
}
#d3_layout_phylotree_context_menu.dropdown-menu > .disabled > a:hover,
#d3_layout_phylotree_context_menu.dropdown-menu > .disabled > a:focus {
 text-decoration: none;
 cursor: not-allowed;
 background-color: transparent;
 background-image: none;
 filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);
}
.open > #d3_layout_phylotree_context_menu.dropdown-menu {
 display: block;
}
#d3_layout_phylotree_context_menu.dropdown-menu-right {
 right: 0;
 left: auto;
}
#d3_layout_phylotree_context_menu.dropdown-menu-left {
 right: auto;
 left: 0;
}
#d3_layout_phylotree_context_menu.dropdown-header {
 display: block;
 padding: 3px 20px;
 font-size: 12px;
 line-height: 1.42857143;
 color: #777;
 white-space: nowrap;
}
#d3_layout_phylotree_context_menu.dropdown-backdrop {
 position: fixed;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 z-index: 990;
}

</style>
