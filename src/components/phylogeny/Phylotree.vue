<template>
  <div>
    <template v-if="newickErrors">
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
          'left-right-spacing': 'fit-to-size',
          'top-bottom-spacing': 'fixed-step',
        })
        .style_nodes((element, data) => {
          // Instructions used to style nodes in Phylotree
          // - element: The D3 element of the node being styled
          // - data: The data associated with the node being styled

          // Make sure we don't already have an internal label node on this SVG node!
          let textLabel = element.selectAll('text');

          if (has(data, 'name') && data.name !== '' && data.children) {
            // If the node has a label and has children (i.e. is an internal node),
            // we display it next to the node by creating a new 'text' element.
            if (textLabel.empty()) {
              textLabel = element.append('text');

              // Place internal label to the left of the root node.
              textLabel.classed('internal-label', true)
                .text(data.name)
                .attr('dx', '.3em')
                .attr('dy', '.3em');
            }
          }
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
 * Classes for phylogeny SVG elements
 */

/*
 * Phylotree .node refers to the SVG groups that contain both the
 * node itself as well as the text label next to it. This is confusing,
 * but we will try to use that consistently below: *-node refers to the group
 * that includes both the node as well as the label with it, while *-label
 * refers only to the labels next to the nodes.
 */
.node {
  /* Phylotree's CSS sets this to 10px; we prefer larger node labels */
  font-size: 11pt;
}

/* Labels for internal nodes, whether phylorefs or not */
.internal-label {
  font-family: serif;
  font-size: 16pt;
  font-style: italic;

  text-anchor: start; /* Align text so it starts at the coordinates provided */
}

/* Node label for an internal specifier */
.internal-specifier-node text {
    font-weight: bolder;
    fill: rgb(0, 24, 168) !important;
}

/* Node label for an external specifier */
.external-specifier-node text {
    font-weight: bolder;
    fill: rgb(0, 24, 168) !important;
}

/* Node label for a terminal node without taxonomic units */
.terminal-node-without-tunits {
}

/* The selected internal label on a phylogeny, whether determined to be the pinning node or not. */
.selected-internal-label {
    font-size: 16pt;
    fill: rgb(0, 24, 168);
}

/*
 * An additional class for nodes that are the pinning node. When the phyloreference
 * resolves to a single terminal node, it will be laid out in this way, rather
 * than as an .internal-specifier-node.
 */
.pinning-node text {
    font-weight: bolder;
}

/*
 * The descendant-of-pinning-node class instructions below apply to the entire resolved node,
 * which includes the circle as well as the text label. We want to coordinate
 * colours between:
 *  - The circle that appears next to the node label,
 *  - The node label, whether internal or terminal, and
 *  - The branches descending from the pinning node.
 *
 * Note that .internal-specifier-node is set up to override this formatting, so
 * internal node labels will be formatted differently from other terminals
 * descending from the pinning node.
 */
.descendant-of-pinning-node-node circle {
  fill: rgb(0, 24, 168);
}

.descendant-of-pinning-node-node text {
}

.descendant-of-pinning-node-branch {
  stroke: rgb(0, 24, 168);
}

/*
 * Create a table class for a fixed size body.
 * Based on https://stackoverflow.com/a/23518856/27310
 */
.table-fixed-height {
}

.table-fixed-height thead {
    display: block;
    width: 100%;
}

.table-fixed-height tbody {
    display: block;
    width: 100%;
    height: 15em;
    overflow-y: scroll;
    z-index: -1;
}

.table-fixed-height tr {
    width: 100%;
    display: inline-table;
    table-layout: fixed;
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
