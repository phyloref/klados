<template>
  <div id="app">
    <TopNavigationBar :version="version" />
    <div id="wrapper">
      <Sidebar />
      <div id="page-content-wrapper">
        <template v-if="display.phyloref">
          <PhylorefView
            :phyloref="display.phyloref"
            :specifier="display.specifier"
          />
        </template>
        <template v-else-if="display.phylogeny">
          <PhylogenyView :phylogeny="display.phylogeny" />
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
/*
 * Lays out the entire page, including inserting the (hidden) modals so they can be displayed.
 */

import { isEqual } from 'lodash';
import { mapState } from 'vuex';

// Navigation controls.
import TopNavigationBar from './components/TopNavigationBar.vue';
import Sidebar from './components/sidebar/Sidebar.vue';

// At any point, one of these views will be displayed.
import PhylogenyView from './components/phylogeny/PhylogenyView.vue';
import PhylorefView from './components/phyloref/PhylorefView.vue';
import PhyxView from './components/phyx/PhyxView.vue';

// Modal dialogs to be displayed above the UI.
import AboutCurationToolModal from './components/modals/AboutCurationToolModal.vue';
import AdvancedOptionsModal from './components/modals/AdvancedOptionsModal.vue';

// Load some configuration options.
import {
  COOKIE_EXPIRY,
  COOKIE_CURATOR_NAME,
  COOKIE_CURATOR_EMAIL,
  COOKIE_CURATOR_ORCID,
} from './config';

export default {
  name: 'App',
  components: {
    TopNavigationBar,
    Sidebar,
    PhyxView,
    PhylogenyView,
    PhylorefView,
    AboutCurationToolModal,
    AdvancedOptionsModal,
  },
  data: () => ({
    version: process.env.VUE_APP_VERSION,
  }),
  computed: mapState({
    display: state => state.ui.display,
    currentPhyx: state => state.phyx.currentPhyx,
    loadedPhyx: state => state.phyx.loadedPhyx,
  }),
  watch: {
    currentPhyx() {
      // If currentPhyx changes, reasoning results can no longer be trusted.
      // So reset them!
      console.log('currentPhyx changed; resetting resolution results.');
      this.$store.commit('setReasoningResults', undefined);
    },
  },
  created() {
    // We store some information as browser cookies so that users don't need to re-enter them
    // every time. One of these (the default nomenclatural code) is entirely handled in modules/phyx.js.
    // Three of them need to be set on the default empty Phyx file here:
    if (this.$cookies.get(COOKIE_CURATOR_NAME)) {
      this.$store.commit('setCurator', { name: this.$cookies.get(COOKIE_CURATOR_NAME) });
    }

    if (this.$cookies.get(COOKIE_CURATOR_EMAIL)) {
      this.$store.commit('setCurator', { email: this.$cookies.get(COOKIE_CURATOR_EMAIL) });
    }

    if (this.$cookies.get(COOKIE_CURATOR_ORCID)) {
      this.$store.commit('setCurator', { orcid: this.$cookies.get(COOKIE_CURATOR_ORCID) });
    }

    // Reset the "changed" flags (in case the above code changed the Phyx file)
    this.$store.commit('setLoadedPhyx');

    // If someone tries to navigate away from the window while the
    // PHYX has been modified, ask users to confirm before leaving.
    // Confirmation message to display to the user. Note that modern
    // browsers do not display this message, but provide a generic
    // "content has changed" dialog instead.
    $(window).on('beforeunload', () => {
      const confirmationMessage = 'Your modifications have not been saved and will be lost if you close Klados. Confirm to discard your changes, or cancel to return to Klados.';

      if (!isEqual(this.loadedPhyx, this.currentPhyx)) return confirmationMessage;
      return false;
    });
  },
};
</script>

<style>
/*
 * Classes for overall design.
 */

#wrapper {
  padding-top: 64px;
  padding-left: 250px;
  margin-bottom: 10px;
  transition: all 0.4s ease 0s;
}

#sidebar-wrapper {
  font-size: 80%;
  margin-left: -250px;
  padding: 0px 5px;
  position: fixed;
  padding-top: 64px;
  bottom: 0px;
  left: 250px;
  width: 250px;
  height: 100%;
  overflow-y: auto;
  z-index: 1000;
  transition: all 0.4s ease 0s;
}

#page-content-wrapper {
  width: 100%;
  padding: 0px 10px;
}
</style>
