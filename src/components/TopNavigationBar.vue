<template>
  <div>
    <!-- Navigation bar at the top of the page -->
    <nav class="navbar navbar-expand navbar-dark bg-dark mb-2 fixed-top">
      <a
        class="navbar-brand"
        href="index.html"
      >
        Curation Tool v{{ version }}
      </a>
      <div class="collapse navbar-collapse">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a
              class="nav-link"
              href="#"
              onclick="$('#about-curation-tool').modal()"
            >
              About this tool
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              href="https://www.phyloref.org/"
            >
              Phyloreferencing website
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              href="https://github.com/phyloref/curation-tool"
            >
              Github repository
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              href="https://github.com/phyloref/curation-tool/issues"
            >
              Report bug
            </a>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'TopNavigationBar',
  props: {
    version: {
      type: String,
      default: 'UNKNOWN',
    },
  },
};
</script>
