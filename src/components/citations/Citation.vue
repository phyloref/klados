<template>
  <div class="form-group row">
    <label class="col-form-label col-md-2">
      {{ label }}
    </label>
    <div class="col-md-10">
      <template v-if="citations.length === 0">
        <a
          class="form-control-plaintext"
          href="javascript:;"
          @click="citations.push({})"
        >
          Add citation
        </a>
      </template>
      <template v-for="(citation, citationIndex) of citations">
        <div class="input-group">
          <input
            type="text"
            readonly
            class="form-control hand-cursor"
            :value="
              wrappedCitation(citation).toString() ||
              'Empty citation, click to enter'
            "
            @click="toggleCitationExpanded(citationIndex)"
          />
          <div class="input-group-append">
            <a
              v-if="wrappedCitation(citation).url"
              class="btn btn-primary"
              target="_blank"
              :href="wrappedCitation(citation).url"
            >
              Open cited work
            </a>
            <a
              class="btn btn-secondary"
              href="javascript:;"
              @click="toggleCitationExpanded(citationIndex)"
            >
              <template v-if="citationsExpanded.includes(citationIndex)">
                Close
              </template>
              <template v-else> Expand </template>
            </a>
            <a
              class="btn btn-danger"
              href="javascript:;"
              @click="deleteCitation(citationIndex)"
            >
              <b-icon icon="trash" />
            </a>
          </div>
        </div>
        <div v-if="citationsExpanded.includes(citationIndex)" class="card mt-1">
          <div class="card-body">
            <h5 class="card-title">Citation details</h5>

            <!-- Citation type -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="citation-type">
                Citation type
              </label>
              <div class="col-md-10">
                <select
                  id="citation-type"
                  v-model="citation.type"
                  class="form-control"
                  @change="updateCitations()"
                >
                  <option value="article">Article</option>
                  <option value="book">Book</option>
                  <option value="book_section">Book section</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
            </div>

            <!-- Authors (one per line) -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="authors">
                Authors (one per line)
              </label>
              <div class="col-md-10">
                <textarea
                  id="authors"
                  rows="3"
                  class="form-control"
                  :value="wrappedCitation(citation).authorsAsStrings.join('\n')"
                  @change="
                    wrappedCitation(citation).authorsAsStrings =
                      $event.target.value.split(/\s*\n\s*/);
                    updateCitations();
                  "
                />
              </div>
            </div>

            <!-- Editors (one per line) -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="editors">
                Editors (one per line)
              </label>
              <div class="col-md-10">
                <textarea
                  id="editors"
                  rows="2"
                  class="form-control"
                  :value="wrappedCitation(citation).editorsAsStrings.join('\n')"
                  @change="
                    wrappedCitation(citation).editorsAsStrings =
                      $event.target.value.split(/\s*\n\s*/);
                    updateCitations();
                  "
                />
              </div>
            </div>

            <!-- Series editors (one per line) -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="series-editors">
                Series editors (one per line)
              </label>
              <div class="col-md-10">
                <textarea
                  id="series-editors"
                  rows="2"
                  class="form-control"
                  :value="
                    wrappedCitation(citation).seriesEditorsAsStrings.join('\n')
                  "
                  @change="
                    wrappedCitation(citation).seriesEditorsAsStrings =
                      $event.target.value.split(/\s*\n\s*/);
                    updateCitations();
                  "
                />
              </div>
            </div>

            <!-- Title -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="title"> Title </label>
              <div class="col-md-10">
                <input
                  id="title"
                  v-model="citation.title"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>
            </div>

            <!-- Section title -->
            <div v-if="citation.type === 'book_section'" class="form-group row">
              <label class="col-form-label col-md-2" for="section-title">
                Section title
              </label>
              <div class="col-md-10">
                <input
                  id="section-title"
                  v-model="citation.section_title"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>
            </div>

            <!-- Publication year -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="year"> Year </label>
              <div class="col-md-4">
                <input
                  id="year"
                  v-model="citation.year"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>

              <!-- Edition -->
              <template v-if="citation.type !== 'article'">
                <label class="col-form-label col-md-2" for="edition">
                  Edition
                </label>
                <div class="col-md-4">
                  <input
                    id="edition"
                    v-model="citation.edition"
                    type="text"
                    class="form-control"
                    @change="updateCitations()"
                  />
                </div>
              </template>
            </div>

            <!-- Pages and figure -->
            <div class="form-group row">
              <!-- Pages -->
              <label class="col-form-label col-md-2" for="pages"> Pages </label>
              <div class="col-md-4">
                <input
                  id="pages"
                  v-model="citation.pages"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>

              <!-- Figure -->
              <label class="col-form-label col-md-2" for="figure">
                Figure
              </label>
              <div class="col-md-4">
                <input
                  id="figure"
                  v-model="citation.figure"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>
            </div>

            <!-- Only for article entries! -->
            <template v-if="citation.type === 'article'">
              <!-- Journal title -->
              <div class="form-group row">
                <label class="col-form-label col-md-2" for="journal-title">
                  Journal title
                </label>
                <div class="col-md-10">
                  <input
                    id="journal-title"
                    v-model="wrappedCitation(citation).journal.name"
                    type="text"
                    class="form-control"
                    @change="updateCitations()"
                  />
                </div>
              </div>

              <!-- Journal volume and issue -->
              <div class="form-group row">
                <!-- Journal volume -->
                <label class="col-form-label col-md-2" for="journal-volume">
                  Volume
                </label>
                <div class="col-md-4">
                  <input
                    id="journal-volume"
                    v-model="wrappedCitation(citation).journal.volume"
                    type="text"
                    class="form-control"
                    @change="updateCitations()"
                  />
                </div>

                <!-- Journal issue/number -->
                <label class="col-form-label col-md-2" for="journal-issue">
                  Issue number
                </label>
                <div class="col-md-4">
                  <input
                    id="journal-issue"
                    v-model="wrappedCitation(citation).journal.number"
                    type="text"
                    class="form-control"
                    @change="updateCitations()"
                  />
                </div>
              </div>

              <!-- ISSNs (one per line) -->
              <div class="form-group row">
                <label class="col-form-label col-md-2" for="issns">
                  ISSNs (one per line)
                </label>
                <div class="col-md-10">
                  <div class="input-group">
                    <textarea
                      id="issns"
                      rows="1"
                      class="form-control"
                      :value="
                        wrappedCitation(
                          wrappedCitation(citation).journal
                        ).issns.join('\n')
                      "
                      @change="
                        wrappedCitation(
                          wrappedCitation(citation).journal
                        ).issns = $event.target.value.split(/\s*\n\s*/);
                        updateCitations();
                      "
                    />
                    <div class="input-group-append">
                      <a
                        class="btn btn-outline-secondary align-middle"
                        target="_blank"
                        style="vertical-align: middle"
                        :href="
                          'https://www.worldcat.org/search?q=n2%3A' +
                          wrappedCitation(wrappedCitation(citation).journal)
                            .issns[0]
                        "
                        :class="{
                          disabled:
                            (
                              wrappedCitation(wrappedCitation(citation).journal)
                                .issns || []
                            ).length === 0,
                        }"
                      >
                        Open in new window
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ISBNs (one per line) -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="isbns">
                ISBNs (one per line)
              </label>
              <div class="col-md-10">
                <div class="input-group">
                  <textarea
                    id="isbns"
                    rows="1"
                    class="form-control"
                    :value="
                      wrappedCitation(
                        wrappedCitation(citation).journal
                      ).isbns.join('\n')
                    "
                    @change="
                      wrappedCitation(wrappedCitation(citation).journal).isbns =
                        $event.target.value.split(/\s*\n\s*/);
                      updateCitations();
                    "
                  />
                  <div class="input-group-append">
                    <a
                      class="btn btn-outline-secondary align-middle"
                      target="_blank"
                      style="vertical-align: middle"
                      :href="
                        'https://www.worldcat.org/search?q=bn%3A' +
                        wrappedCitation(wrappedCitation(citation).journal)
                          .isbns[0]
                      "
                      :class="{
                        disabled:
                          (
                            wrappedCitation(wrappedCitation(citation).journal)
                              .isbns || []
                          ).length === 0,
                      }"
                    >
                      Open in new window
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Publisher and city -->
            <div class="form-group row">
              <!-- Publisher -->
              <label class="col-form-label col-md-2" for="publisher">
                Publisher
              </label>
              <div class="col-md-4">
                <input
                  id="publisher"
                  v-model="citation.publisher"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>

              <!-- Publication city -->
              <label class="col-form-label col-md-2" for="city"> City </label>
              <div class="col-md-4">
                <input
                  id="city"
                  v-model="citation.city"
                  type="text"
                  class="form-control"
                  @change="updateCitations()"
                />
              </div>
            </div>

            <!-- DOIs (one per line) -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="doi">
                DOIs (one per line)
              </label>
              <div class="col-md-10">
                <div class="input-group">
                  <textarea
                    id="doi"
                    rows="1"
                    class="form-control"
                    :value="wrappedCitation(citation).doisAsStrings.join('\n')"
                    @change="
                      wrappedCitation(citation).doisAsStrings =
                        $event.target.value.split(/\s*\n\s*/);
                      updateCitations();
                    "
                  />
                  <div class="input-group-append">
                    <a
                      class="btn btn-outline-secondary align-middle"
                      target="_blank"
                      style="vertical-align: middle"
                      :href="
                        wrappedCitation(citation).firstDOI
                          ? 'http://doi.org/' +
                            wrappedCitation(citation).firstDOI
                          : undefined
                      "
                      :class="{ disabled: !wrappedCitation(citation).firstDOI }"
                    >
                      Open in new window
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- URLs (one per line) -->
            <div class="form-group row">
              <label class="col-form-label col-md-2" for="urls">
                URLs (one per line)
              </label>
              <div class="col-md-10">
                <div class="input-group">
                  <textarea
                    id="urls"
                    rows="1"
                    class="form-control"
                    :value="wrappedCitation(citation).urlsAsStrings.join('\n')"
                    @change="
                      wrappedCitation(citation).urlsAsStrings =
                        $event.target.value.split(/\s*\n\s*/);
                      updateCitations();
                    "
                  />
                  <div class="input-group-append">
                    <a
                      class="btn btn-outline-secondary align-middle"
                      target="_blank"
                      style="vertical-align: middle"
                      :href="wrappedCitation(citation).firstURL"
                      :class="{ disabled: !wrappedCitation(citation).firstURL }"
                    >
                      Open in new window
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
/*
 * Displays a citation as a textfield/expanded field.
 */

import Vue from "vue";
import { BIcon, BIconTrash } from "bootstrap-vue";
import { has, isEmpty, isEqual, cloneDeep, pickBy } from "lodash";

export default {
  name: "Citation",
  components: {
    BIcon,
    BIconTrash,
  },
  props: {
    label: {
      /* The label for this citation */ type: String,
      default: "Citation",
    },
    object: {
      /* The object containing the citation to display and edit */ type: Object,
      required: true,
    },
    citationKey: {
      /* The key on the object containing the citation to display and edit */
      type: String,
      required: true,
    },
  },
  data() {
    // Set up a citations variable that has to be an array. It may actually be a
    // single object in the JSON file; in that case, we convert it into an array.
    // In any case, we want to clone it -- changes in this component shouldn't
    // propagate to the model directly, but should go through this.updateCitations().
    const citations = this.getCitationsFromProps();

    return {
      // Which citations have been expanded (by index).
      citationsExpanded: [],

      // Copy of the citations provided to this component.
      citations,

      // Items used to store new items.
      newDOI: "",
    };
  },
  watch: {
    citations() {
      this.updateCitations();
    },
    object() {
      this.citations = this.getCitationsFromProps();
    },
    citationKey() {
      this.citations = this.getCitationsFromProps();
    },
  },
  methods: {
    deleteCitation(index) {
      // Remove the citation at a particular index from the input citations.
      // eslint-disable-next-line no-restricted-globals
      if (confirm("Are you sure you wish to delete this citation?")) {
        if (Array.isArray(this.object[this.citationKey])) {
          this.object[this.citationKey].splice(index, 1);
        } else {
          Vue.delete(this.object, this.citationKey);
        }
      }
    },
    getCitationsFromProps() {
      // Returns the citations from the properties provided to this object.
      //
      // The trick is that this needs to always be an array, so we turn it into
      // an array of a single element if we need to.

      if (Array.isArray(this.object[this.citationKey])) {
        return cloneDeep(this.object[this.citationKey]);
      }
      if (isEmpty(this.object[this.citationKey])) {
        return [];
      }

      return [cloneDeep(this.object[this.citationKey])];
    },
    updateCitations() {
      // If our citations have changed, update the state of the citation they
      // point to.
      if (isEmpty(this.citations)) return;

      // Exception: this component will ALWAYS add a 'journal' key to the citation,
      // even if it is empty. We should eliminate that to make the comparison.
      const ourCitations = cloneDeep(this.citations).map((citation) => {
        if (has(citation, "journal") && isEqual(pickBy(citation.journal), {})) {
          delete citation.journal;
        }
        return citation;
      });

      // Exception: we *always* store citations as an array, but
      // this.object[this.citationKey] might be an object. Let's check for that.
      if (isEqual(ourCitations, this.object[this.citationKey])) return;
      if (ourCitations.length === 1) {
        if (isEqual(ourCitations[0], this.object[this.citationKey])) return;

        console.log(
          "Updating citations as ",
          ourCitations[0],
          " differs from ",
          this.object[this.citationKey]
        );
        this.$store.commit("setCitations", {
          object: this.object,
          citationKey: this.citationKey,
          citations: ourCitations[0],
        });
      } else {
        console.log(
          "Updating citations as ",
          ourCitations,
          " differs from ",
          this.object[this.citationKey]
        );
        this.$store.commit("setCitations", {
          object: this.object,
          citationKey: this.citationKey,
          citations: ourCitations,
        });
      }
    },
    toggleCitationExpanded(citationIndex) {
      // Given the index of a citation, either expand it or collapse it.
      // (The citation is expanded if its index is in the citationsExpanded list)
      if (this.citationsExpanded.includes(citationIndex))
        this.citationsExpanded = this.citationsExpanded.filter(
          (index) => index !== citationIndex
        );
      else this.citationsExpanded.push(citationIndex);
    },
    wrappedCitation(citation) {
      // Return the citation
      return this.$store.getters.getCitationModel(citation);
    },
  },
};
</script>

<style>
.hand-cursor {
  cursor: pointer;
}
</style>
