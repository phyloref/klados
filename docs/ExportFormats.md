# Export Formats

## Summary table CSV export

The summary table CSV export includes the following columns:

* `Phyloreference ID`: A URI (absolute, relative or local; may or may not resolve) that identifies this phyloreference. Normally intended for machine consumption.
  * Example `#Alligatoridae`
* `Label`: A label used to identify this phyloreference.
  * Example: `Alligatoridae`
* `Type`: The type of this phyloreference.
  * May be one of the following values:
    * `Apomorphy-based clade definition`
    * `Maximum clade definition`
    * `Minimum clade definition`
    * `Invalid definition (...)` (with the reason for the invalid definition in brackets)
* `Definition`: The (human readable) clade definition as entered in the `Definition in free-form text`.
  * Example: `Last common ancestor of Crocodylus niloticus, Osteolaemus tetraspis, and Tomistoma schlegelii and all of its descendents.`
* `Internal specifier N`: A description of each internal specifier (_N_ is a number starting from 1).
  * Example: `Caiman crocodilus`
* `External specifier N`: A description of each external specifier (_N_ is a number starting from 1).
  * Example: `Caiman crocodilus`
* `Phylogeny: [Phylogeny label] expected`: The node resolved for this phylogeny (_N_ is a number starting from 1, and _Phylogeny label_ is the label of this phylogeny).
  * Example: `Alligatoridae`
* `Phylogeny: [Phylogeny label] actual`: The node resolved for this phylogeny (_N_ is a number starting from 1, and _Phylogeny label_ is the label of this phylogeny).
  * Example: `Alligatoridae_ott195670`, or `(unlabelled)` if the node has no label