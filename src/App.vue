<template>
  <div id="app">
    <TopNavigationBar :version="CURATION_TOOL_VERSION" />
    <div id="wrapper">
      <Sidebar />
      <div id="page-content-wrapper">
        <template v-if="selectedPhyloref">
          <SelectedPhylorefView />
        </template>
        <template v-else-if="selectedPhylogeny">
          <SelectedPhylogenyView />
        </template>
        <template v-else>
          <PhyxView />
        </template>
      </div>
    </div>

    <!-- All modals are included here -->
    <AboutCurationToolModal />
    <AdvancedOptionsModal />
  </div>
</template>

<script>
import { mapState } from 'vuex';

// Navigation controls.
import TopNavigationBar from './components/TopNavigationBar.vue';
import Sidebar from './components/sidebar/Sidebar.vue';

// Panels to be displayed as part of the UI.


// Views that dominate the UI when selected.
import SelectedPhylogenyView from './components/views/SelectedPhylogenyView.vue';
import SelectedPhylorefView from './components/views/SelectedPhylorefView.vue';
import PhyxView from './components/views/PhyxView.vue';

// Modal dialogs to be displayed above the UI.
import AboutCurationToolModal from './components/modals/AboutCurationToolModal.vue';
import AdvancedOptionsModal from './components/modals/AdvancedOptionsModal.vue';

export default {
  name: 'app',
  components: {
    TopNavigationBar,
    Sidebar,
    PhyxView,
    SelectedPhylogenyView,
    SelectedPhylorefView,
    AboutCurationToolModal,
    AdvancedOptionsModal,
  },
  computed: {
    CURATION_TOOL_VERSION () { return this.$store.state.CURATION_TOOL_VERSION; },
    selectedPhyloref () { return this.$store.state.selectedPhyloref; },
    selectedPhylogeny () { return this.$store.state.selectedPhylogeny; },
  }
}
</script>

<style>
/*
 * Curation Tool CSS stylesheet
 *
 * Copyright (C) Phyloreferencing Project, 2018
 */

/*
 * Classes for overall design.
 */

#wrapper {
  padding-left: 250px;
  transition: all 0.4s ease 0s;
}

#sidebar-wrapper {
  font-size: 80%;
  margin-left: -250px;
  padding: 0px 5px;
  left: 250px;
  width: 250px;
  position: fixed;
  height: 100%;
  overflow-y: auto;
  z-index: 1000;
  transition: all 0.4s ease 0s;
}

#page-content-wrapper {
  width: 100%;
  padding: 0px 10px;
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
     font-size: 10pt;
 }

 /* Node label for an internal specifier */
.internal-specifier-node text {
    font-weight: bolder;
    fill: rgb(0, 24, 168) !important;
    font-size: 12pt;
}

/* Node label for an external specifier */
.external-specifier-node text {
    font-weight: bolder;
    fill: rgb(0, 24, 168) !important;
    font-size: 12pt;
}

/* Node label for a terminal node without taxonomic units */
.terminal-node-without-tunits {
}

/* Labels for internal nodes, whether phylorefs or not */
.internal-label {
    font-family: serif;
    font-size: 12pt;
    font-style: italic;

    text-anchor: end; /* Align text so it ends at the coordinates provided */
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
</style>
