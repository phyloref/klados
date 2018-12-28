<template>
  <!-- Navigation bar at the top of the page -->
  <nav class="navbar navbar-default">
    <div class="container-fluid">
      <div class="navbar-header">
        <a class="navbar-brand" href="index.html">Curation Tool v{{CURATION_TOOL_VERSION}}</a>
      </div>
      <div class="collapse navbar-collapse">
        <ul class="nav navbar-nav navbar-right">
          <li><a href="#" onclick="$('#about-curation-tool').modal()">About this tool</a></li>
          <li><a href="https://www.phyloref.org/">Phyloreferencing website</a></li>
          <li><a href="https://github.com/phyloref/curation-tool">Github repository</a></li>
          <li><a href="https://github.com/phyloref/curation-tool/issues">Report bug</a></li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'TopNavigationBar'
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
