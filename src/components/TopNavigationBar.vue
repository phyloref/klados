<template>
  <div>
    <!-- Navigation bar at the top of the page -->
    <nav class="navbar navbar-expand navbar-dark bg-dark mb-2 fixed-top">
      <a
        class="navbar-brand"
        href="index.html"
      >
        Klados
      </a>
      <small class="text-white">{{ version }}</small>
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
              target="_blank"
              href="https://www.phyloref.org/"
            >
              Phyloreferencing website
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              target="_blank"
              href="https://github.com/phyloref/klados"
            >
              Github repository
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              target="_blank"
              href="https://github.com/phyloref/klados/issues"
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

/*
 * The top navigation bar provides links to Phyloreferencing resources,
 * the about-us modal, and a link to report bugs.
 */

export default {
  name: 'TopNavigationBar',
  props: {
    version: {
      type: String,
      default: '(unversioned)',
    },
  },
};
</script>
