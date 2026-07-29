# ezreeport-worker

## 1.2.0

### Minor Changes

- 92b1b03: ✨ can now generate test reports without targets
- 730cac8: ✨ templates can be rendered using locales

### Patch Changes

- aa0eb0f: 🐛 fixed metrics on non-existing fields throwing errors
- 7dedf0c: 🚑 fixed crash at startup
- 7f575a3: 🐛 changed attachment name generation to avoid filesystem issues
- Updated dependencies [92b1b03]
  - @ezreeport/models@0.2.0
  - @ezreeport/heartbeats@0.0.2
  - @ezreeport/rpc@0.0.2

## 1.2.0-rc.0

### Minor Changes

- 92b1b03: ✨ can now generate test reports without targets
- 730cac8: ✨ templates can be rendered using locales

### Patch Changes

- aa0eb0f: 🐛 fixed metrics on non-existing fields throwing errors
- 7f575a3: 🐛 changed attachment name generation to avoid filesystem issues
- Updated dependencies [92b1b03]
  - @ezreeport/models@0.2.0-rc.0
  - @ezreeport/heartbeats@0.0.2-rc.0
  - @ezreeport/rpc@0.0.2-rc.0

## 1.1.4

### Patch Changes

- 0e0bc36: 🚑 fixed error when fetching images for markdown figures

## 1.1.3

### Patch Changes

- Updated dependencies [8c872a3]
  - @ezreeport/models@0.1.0
  - @ezreeport/heartbeats@0.0.1
  - @ezreeport/rpc@0.0.1

## 1.1.3-rc.0

### Patch Changes

- Updated dependencies [8c872a3]
  - @ezreeport/models@0.1.0-rc.0
  - @ezreeport/heartbeats@0.0.1-rc.0
  - @ezreeport/rpc@0.0.1-rc.0

## 1.1.2

### Patch Changes

- b7453b5: 🚑 fixed logo position in footer

## 1.1.1

### Patch Changes

- 4ac80b1: 🚑 fixed OOM when having a text too large for metrics
- 26523a5: 🐛 fixed issue with metrics' aggregations using raw buckets

## 1.1.1-rc.0

### Patch Changes

- 4ac80b1: 🚑 fixed OOM when having a text too large for metrics
- 26523a5: 🐛 fixed issue with metrics' aggregations using raw buckets

## 1.1.0

### Minor Changes

- 3090699: ✨ added support for "filters" aggregations
- 4693218: ✨ heartbeats to external services now use dynamic frequency

### Patch Changes

- f13ab89: 🐛 fixed fetch error in some cases
- fe47a23: 🐛 fixed support of SVG images in Markdown figures
- 5e21ee6: 🐛 fixed formatting issue with validation errors
- 603e0b7: 🐛 fixed issue with svg in markdowns
- a0711c7: 🐛 fixed issue with timeout errors still beign able to send heartbeats

## 1.1.0-rc.1

### Patch Changes

- 603e0b7: 🐛 fixed issue with svg in markdowns
- a0711c7: 🐛 fixed issue with timeout errors still beign able to send heartbeats

## 1.1.0-rc.0

### Minor Changes

- 3090699: ✨ added support for "filters" aggregations
- 4693218: ✨ heartbeats to external services now use dynamic frequency

### Patch Changes

- f13ab89: 🐛 fixed fetch error in some cases
- fe47a23: 🐛 fixed support of SVG images in Markdown figures
- 5e21ee6: 🐛 fixed formatting issue with validation errors
