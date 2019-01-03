<template>
  <div
    id="advanced-options"
    hidden
  >
    <div class="panel panel-info">
      <div class="panel-heading">
        <!-- Close button for panel -->
        <a
          href="#"
          class="close"
          onclick="$('#advanced-options').hide(300)"
        >
          &times;
        </a>
        Advanced options
      </div>
      <div class="panel-body">
        <p>
          The following is a representation of this PHYX in JSON. You
          can edit the JSON directly if you like.
        </p>
        <textarea
          id="test-content"
          v-model="phyxAsJSON"
          style="width: 100%; margin: auto;"
          rows="10"
        />
      </div>
      <div class="panel-footer">
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
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
