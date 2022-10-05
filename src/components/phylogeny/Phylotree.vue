<template>
  <div>
    <template v-if="newickErrors">
      <p>
        <strong>Error parsing phylogeny.</strong>
        Please
        <a
          href="javascript: void"
          @click="$store.commit('changeDisplay', {phylogeny})"
        >
          edit the phylogeny
        </a>
        to fix this error.
      </p>
    </template>
    <div
      v-else
      class="phylotreeContainer"
    >
      <svg
        :id="'phylogeny' + phylogenyIndex"
        class="col-md-12 phylogeny"
      />
      <ResizeObserver @notify="redrawTree" />
    </div>
  </div>
</template>

<script>
/*
 * This component can be used to insert a phylogeny. It includes code for highlighing
 * the expecting and reasoned clade for a particular phyloreference.
 */

import { uniqueId, has } from 'lodash';
import { phylotree, newickParser } from 'phylotree';
import { PhylogenyWrapper, PhylorefWrapper } from '@phyloref/phyx';

/*
 * Note that this requires the Phylotree Javascript to be loaded in the HTML
 * header: I haven't figured out how to include phylotree.js from within Vue CLI yet.
 */

export default {
  name: 'Phylotree',
  props: {
    phylogeny: Object, // The phylogeny to render.
    phyloref: Object, // The phyloreference to highlight.
    spacingX: { // Spacing in the X axis in pixels.
      type: Number,
      default: 20,
    },
    phylogenyIndex: { // An index number of the phylogeny. Will be used to set up HTML DOM IDs.
      type: String,
      default: uniqueId(),
    },
    selectedNodeLabel: { // The selected node label. If not set, we display all node labels.
      type: String,
      required: false,
    },
  },
  data() {
    return {
      // List of pinning nodes to highlight for a particular phylogeny.
      pinningNodes: [],
      // List of pinning nodes and all their children, so the entire clade can be
      // highlighted as needed.
      pinningNodeChildrenIRIs: new Set(),
    };
  },
  computed: {
    reasoningResults() {
      // Included so we can watch this for changes, see `watch` below.
      return this.$store.state.resolution.reasoningResults;
    },
    newickAsString() {
      // Returns the Newick string of this phylogeny.
      return this.phylogeny.newick || '()';
    },
    parsedNewick() {
      return new PhylogenyWrapper(this.phylogeny).getParsedNewickWithIRIs(
        this.$store.getters.getPhylogenyId(this.phylogeny),
        newickParser,
      );
    },
    newickErrors() {
      // Check to see if the newick could actually be parsed.
      if (!has(this.parsedNewick, 'json') || this.parsedNewick.json === null) {
        return (has(this.parsedNewick, 'error') ? this.parsedNewick.error : 'unknown error');
      }
      return undefined;
    },
    tree() {
      // Set up Phylotree.
      return new phylotree(this.parsedNewick, {
        svg: `#phylogeny${this.phylogenyIndex}`,
      });
    },
  },
  watch: {
    phyloref() {
      // We need to redraw the tree when phyloref changes.
      this.redrawTree();
    },
    reasoningResults() {
      // If reasoning occurs, we'll need to redraw this tree.
      this.redrawTree();
    },
    phylogeny() {
      // If the phylogeny changed, redraw the tree.
      this.redrawTree();
    },
    selectedNodeLabel() {
      // If the selected node label changed, redraw the tree.
      this.redrawTree();
    },
    newickAsString() {
      // If the newick changes, redraw the tree.
      this.redrawTree();
    },
  },
  mounted() {
    // Redraw the tree when this component is loaded for the first time.
    this.redrawTree();
  },
  methods: {
    recurseNodes(node, func, nodeCount = 0, parentCount = undefined) {
      // Recurse through PhyloTree nodes, executing function on each node.
      //  - node: The node to recurse from. The function will be called on node
      //          *before* being called on its children.
      //  - func: The function to call on `node` and all of its children.
      //  - nodeCount: `node` will be called with this nodeCount. All of its
      //          children will be called with consecutively increasing nodeCounts.
      //  - parentCount: The nodeCount associated with the parent of this node
      //          within this run of recurseNodes. For instance, immediate children
      //          of `node` will have a parentCount of 0. By default, `node` itself
      //          will have a parentCount of `undefined`.
      // When the function `func` is called, it is given three arguments:
      //  - The current node object (initially: `node`)
      //  - The count of the current node object (initially: `nodeCount`)
      //  - The parent count of the current node object (initially: `parentCount`)
      func(node, nodeCount, parentCount);

      let nextID = nodeCount + 1;

      // Recurse through all children of this node.
      if (has(node, 'children')) {
        node.children.forEach((child) => {
          nextID = this.recurseNodes(
            child,
            func,
            nextID,
            nodeCount,
          );
        });
      }

      return nextID;
    },
    redrawTree() {
      // Reset the pinning node information before redrawing.
      this.pinningNodes = [];
      this.pinningNodeChildrenIRIs = new Set();

      // Draw the tree.
      this.tree
        .render({
          'left-right-spacing': 'fit-to-size',
          'top-bottom-spacing': 'fit-to-size'
        });
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
  font-size: 12pt !important;
}

/* Labels for internal nodes, whether phylorefs or not */
.internal-label {
  font-family: serif;
  font-size: 16pt;
  font-style: italic;

  text-anchor: start; /* Align text so it starts at the coordinates provided */
  alignment-baseline: middle;
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
    fill: black !important;
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
