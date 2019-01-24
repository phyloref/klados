<template>
  <div
    id="advanced-options"
    class="modal"
    tabindex="-1"
    role="dialog"
  >
    <div
      class="modal-dialog"
      role="document"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            Advanced options
          </h5>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">
              &times;
            </span>
          </button>
        </div>

        <!-- Body of the about-us modal dialog -->
        <div class="modal-body">
          <p>
            The following is a representation of this PHYX in JSON. You
            can edit the JSON directly if you like.
          </p>

          <div
            v-if="JSONParsingError"
            class="card text-white bg-danger mb-2"
          >
            <div class="card-body">
              <p class="card-text">
                This JSON could not be parsed: {{ JSONParsingError }}
              </p>
            </div>
          </div>

          <textarea
            id="test-content"
            v-model.lazy="phyxAsJSON"
            style="width: 100%; margin: auto;"
            rows="10"
          />
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-info"
            @click="downloadAsJSONLD()"
          >
            Download as JSON-LD
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PHYXWrapper } from 'phyx.js';
import { saveAs } from 'filesaver.js-npm';

export default {
  name: 'AdvancedOptionsPanel',
  data() {
    return {
      JSONParsingError: undefined,
    };
  },
  computed: {
    phyxAsJSON: {
      get() {
        return this.$store.getters.getPhyxAsJSON;
      },
      set(value) {
        try {
          const phyx = JSON.parse(value);
          this.$store.commit('setCurrentPhyx', phyx);
          this.JSONParsingError = undefined;
        } catch (ex) {
          this.JSONParsingError = ex.message;
        }
      },
    },
  },
  methods: {
    downloadAsJSONLD() {
      // Exports the PHYX file as an OWL/JSON-LD file, which can be opened in
      // Protege or converted into OWL/XML or other formats.
      const wrapped = new PHYXWrapper(this.$store.state.phyx.currentPhyx);
      const content = [JSON.stringify([wrapped.asJSONLD()], undefined, 4)];

      // Save to local hard drive.
      const jsonldFile = new File(content, 'download.jsonld', { type: 'application/json;charset=utf-8' });
      saveAs(jsonldFile);
    },
  },
};
</script>
