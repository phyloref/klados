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
          this.$store.commit('setPhyx', phyx);
          this.JSONParsingError = undefined;
        } catch (ex) {
          this.JSONParsingError = ex.message;
        }
      },
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
