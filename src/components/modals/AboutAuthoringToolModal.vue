<template>
  <!-- About-us modal dialog box: acknowledges funding and links to libraries used -->
  <div
    id="about-authoring-tool"
    class="modal"
    tabindex="-1"
    role="dialog"
  >
    <div
      class="modal-dialog"
      role="document"
    >
      <div class="modal-content">
        <!-- Header of tunit editor modal dialog box -->
        <div class="modal-header">
          <h5 class="modal-title">
            About this tool
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
        <div class="modal-body col-md-12">
          <p>
            The Phyloreferencing Authoring Tool was built as part of the
            <a href="https://www.phyloref.org">
              Phyloreferencing project
            </a>,
            funded by the US National Science Foundation through collaborative
            grants <a href="http://www.nsf.gov/awardsearch/showAward?AWD_ID=1458484">
              DBI-1458484
            </a>
            and <a href="http://www.nsf.gov/awardsearch/showAward?AWD_ID=1458604">
              DBI-1458604
            </a>.
            See <a href="http://www.phyloref.org/about/#funding">
              Funding
            </a> for details.
          </p>

          <p>The Phyloref Authoring Tool uses a number of open-source libraries, including:</p>

          <ul>
            <li>
              <a href="https://cli.vuejs.org/">
                Vue CLI 3
              </a>
            </li>
            <li>
              <a href="https://getbootstrap.com/">
                Bootstrap
              </a>
            </li>
            <li>
              <a href="https://jquery.com/">
                jQuery
              </a>
            </li>
            <li>
              <a href="https://github.com/veg/phylotree.js">
                phylotree.js
              </a>,
              published as <a href="https://doi.org/10.1186/s12859-018-2283-2">
                Shank <em>et al</em>, 2018
              </a>
            </li>
            <li>
              <a href="https://d3js.org/">
                D3.js
              </a>
            </li>
            <li>
              <a href="https://momentjs.com/">
                Moment.js
              </a>
            </li>
            <li>
              <a href="https://github.com/eligrey/FileSaver.js">
                FileSaver.js
              </a>
            </li>
            <li>
              <a href="https://fontawesome.com/">
                Font Awesome
              </a>
            </li>
          </ul>
        </div>

        <!-- Footer of the about-us modal dialog -->
        <div class="modal-footer">
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
/*
 * A modal for displaying information about the Authoring Tool
 */

export default {
  name: 'AboutAuthoringToolModal',
};
</script>
