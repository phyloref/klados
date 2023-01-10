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
      <div
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
import jQuery from 'jquery';

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
      // The TreeRender object.
      treeRender: null,
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
    phylogenyWrapped() {
      return new PhylogenyWrapper(this.phylogeny);
    },
    parsedNewick() {
      return this.phylogenyWrapped.getParsedNewickWithIRIs(
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
      return new phylotree(this.parsedNewick.json);
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
      const display = this.tree
        .render({
          'left-right-spacing': 'fit-to-size',
          'top-bottom-spacing': 'fit-to-size',
          'minimum-per-level-spacing': 50,
          'minimum-per-node-spacing': 10,
          'align-tips': true,
          'node-styler': ((element, node) => {
            const data = node.data;
            //console.log('node_styler:', element, node, data);

            // Instructions used to style nodes in Phylotree
            // - element: The D3 element of the node being styled
            // - data: The data associated with the node being styled
            // Wrap the phylogeny so we can call methods on it.
            const wrappedPhylogeny = new PhylogenyWrapper(this.phylogeny || {});
            // Wrap the phyloref is there is one.
            // const wrappedPhyloref = new PhylorefWrapper(this.phyloref || {});
            // Make sure we don't already have an internal label node on this SVG node!
            let textLabel = element.selectAll('text');

            if (has(data, 'name') && data.name !== '' && data.children) {
              // If the internal label has the same label as the currently
              // selected phyloreference, add an 'id' so we can jump to it
              // and a CSS class to render it differently from other labels.
              if (
              // Display a label if:
              //  (1) No selectedNodeLabel was provided to us (i.e. display all node labels), or
              //  (2) We are currently rendering the selectedNodeLabel.
                !this.selectedNodeLabel
                  || this.selectedNodeLabel.toLowerCase() === data.name.toLowerCase()
              ) {
                if (textLabel.empty()) textLabel = element.append('text');
                textLabel.classed('internal-label', true)
                  .text(data.name)
                  .attr('dx', '0.3em')
                  .attr('dy', '0.35em');
                // Is this the currently selected internal label?
                // eslint-disable-next-line max-len
                if (this.selectedNodeLabel && this.selectedNodeLabel.toLowerCase() === data.name.toLowerCase()) {
                  textLabel.attr('id', `current_expected_label_phylogeny_${this.phylogenyIndex}`);
                  textLabel.classed('selected-internal-label', true);
                }
              } else if (!textLabel.empty()) textLabel.remove();
            }
            // Remove any previously added custom menu items.
            // data.menu_items = [];
            // Add a custom menu item to allow us to rename this node.

            /*
            addCustomMenu(data,
              'Rename this node',
                () => {
                  const node = data;
                  const existingName = node.name || '(none)';
                  const newName = window.prompt(`Rename node named '${existingName}' to:`);
                  // Apparently IE7 and IE8 will return the string 'undefined' if the user doesn't
                  // enter anything.
                  if (!newName || newName == 'undefined') {
                    // Remove the current label.
                    node.name = '';
                  } else {
                    // Set the new label.
                    node.name = newName;
                  }
                  // Export the entire phylogeny as a Newick string, and store that
                  // in the phylogeny object.
                  this.$store.commit('setPhylogenyProps', {
                    phylogeny: this.phylogeny,
                    newick: this.tree.get_newick((n) => {
                      // There appears to be a bug in the version of Phylotree.js we
                      // use in which leaf nodes are duplicated if we just return n.name
                      // here. So we return undefined for leaf nodes and n.name for
                      // everything else. I'll investigate this more deeply in
                      // https://github.com/phyloref/klados/issues/200.
                      if (!this.tree.is_leafnode(n)) return n.name;
                      return undefined;
                    }),
                  });
                },
                node => true, // We can replace this with a condition that indicates whether this node should be displayed.
            );
             */

            // If the internal label has the same IRI as the currently selected
            // phyloreference's reasoned node, further mark it as the resolved node.
            //
            // Note that this node might NOT be labeled, in which case we need to
            // label it now!
            // console.log("Gonna try this", this.phyloref, data, this.$store.getters.getResolvedNodesForPhylogeny(this.phylogeny, this.phyloref));
            if (
              this.phyloref !== undefined && has(data, '@id')
                && this.$store.getters.getResolvedNodesForPhylogeny(this.phylogeny, this.phyloref).includes(data['@id'])
            ) {
              // We found another pinning node!
              this.pinningNodes.push(data);
              this.recurseNodes(data, n => this.pinningNodeChildrenIRIs.add(n['@id']));
              // Mark this node as the pinning node.
              element.classed('pinning-node', true);
              // Make the pinning node circle larger (twice its usual size of 3).
              element.select('circle').attr('r', 6);
              // Set its id to 'current_pinning_node_phylogeny{{phylogenyIndex}}'
              element.attr('id', `current_pinning_node_phylogeny_${this.phylogenyIndex}`);
            }

            // Maybe this isn't a pinning node, but it is a child of a pinning node.
            if (
              has(data, '@id')
                && this.pinningNodeChildrenIRIs.has(data['@id'])
            ) {
              // Apply a class.
              // Note that this applies to the resolved-node too.
              element.classed('descendant-of-pinning-node-node', true);
            }

            if (data.name !== undefined && data.children === undefined) {
              // Labeled leaf node! Look for taxonomic units.
              const tunits = wrappedPhylogeny.getTaxonomicUnitsForNodeLabel(data.name);
              if (tunits.length === 0) {
                element.classed('terminal-node-without-tunits', true);
              } else if (this.phyloref !== undefined) {
                // If this is a terminal node, we should set its ID to
                // `current_expected_label_phylogeny${phylogenyIndex}` if it is
                // the currently expected node label.
                if (
                  has(this.phyloref, 'label')
                    && this.selectedNodeLabel
                    && this.selectedNodeLabel.toLowerCase() === data.name.toLowerCase()
                ) {
                  textLabel.attr('id', `current_expected_label_phylogeny_${this.phylogenyIndex}`);
                }
                // We should highlight internal specifiers.
                if (has(this.phyloref, 'internalSpecifiers')) {
                  if (this.phyloref.internalSpecifiers
                    .some(specifier => wrappedPhylogeny
                      .getNodeLabelsMatchedBySpecifier(specifier)
                      .includes(data.name))
                  ) {
                    element.classed('internal-specifier-node', true);
                  }
                }
                // We should highlight external specifiers.
                if (has(this.phyloref, 'externalSpecifiers')) {
                  if (this.phyloref.externalSpecifiers
                    .some(specifier => wrappedPhylogeny
                      .getNodeLabelsMatchedBySpecifier(specifier)
                      .includes(data.name))
                  ) {
                    element.classed('external-specifier-node', true);
                  }
                }
              }
            }
          }),
          'edge-styler': ((element, data) => {
            //console.log('edge_styler:', element, data);

            // Is the parent a descendant of a pinning node? If so, we need to
            // select this branch!
            if (
              has(data, 'source.data')
                && has(data.source.data, '@id')
                && this.pinningNodeChildrenIRIs.has(data.source.data['@id'])
            ) {
              // Apply a class to this branch.
              element.classed('descendant-of-pinning-node-branch', true);
              // element.setAttribute('class', 'branch descendant-of-pinning-node-branch');
              // console.log('Added classes to', element, element.attr('class'));
            } else {
              element.classed('descendant-of-pinning-node-branch', false);
              // element.setAttribute('class', 'branch');
              // console.log('Removed classes from', element, element.attr('class'));
            }
          }),
          container: `#phylogeny${this.phylogenyIndex}`,
        });

      // Resize the tree to the size of the container.
      const container = jQuery(`#phylogeny${this.phylogenyIndex}`);
      const height = container.innerHeight() < 600 ? 600 : container.innerHeight();
      const width = container.innerWidth() < 800 ? 800 : container.innerWidth();

      console.log("container.innerWidth()", container.innerWidth());
      console.log("container.innerHeight()", container.innerHeight());

      display.font_size = 16;
      display.size = [
        // width
        width * 2,
        // height
        height * 2,
        // We need more space because our fonts are bigger than the default.
      ];

      jQuery(display.container).empty();
      jQuery(display.container).html(display.show());
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
