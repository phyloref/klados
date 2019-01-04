<template>
  <div
    id="advanced-options"
    class="d-none"
  >
    <div class="card mb-2">
      <div class="card-body">
        <h5 class="card-title">Advanced options
          <!-- Close button for panel -->
          <a
            href="#"
            class="close"
            onclick="$('#advanced-options').toggleClass('d-none')"
          >
            &times;
          </a>
        </h5>
        <p class="card-text">
          The following is a representation of this PHYX in JSON. You
          can edit the JSON directly if you like.
        </p>

        <div v-if="JSONParsingError" class="card text-white bg-danger mb-2">
          <div class="card-body">
            <p class="card-text">This JSON could not be parsed: {{JSONParsingError}}</p>
          </div>
        </div>

        <textarea
          id="test-content"
          v-model.lazy="phyxAsJSON"
          style="width: 100%; margin: auto;"
          rows="10"
        />
      </div>
      <div class="card-footer">
        <div
          class="btn-group btn-group-justified"
          role="group"
          aria-label="Actions for phylogenies"
        >
          <div
            class="btn-group"
            role="group"
          >
            <button
              id="download-as-jsonld-btn"
              type="button"
              class="btn btn-info"
              @click="downloadAsJSONLD()"
            >
              Download as JSON-LD
            </button>
          </div>
        </div>
      </div>
    </div>
  </div><!-- End of panels above the main panel -->
</template>

<script>
export default {
  name: 'AdvancedOptionsPanel',
  data () {
    return {
      JSONParsingError: undefined,
    };
  },
  computed: {
    phyxAsJSON: {
      get () {
        return this.$store.getters.getPhyxAsJSON;
      },
      set (value) {
        try {
          const phyx = JSON.parse(value);
          this.$store.commit('setPhyx', phyx);
          this.JSONParsingError = undefined;
        } catch(ex) {
          this.JSONParsingError = ex.message;
        }
      }
    },
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
