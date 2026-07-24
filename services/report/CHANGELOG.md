# ezreeport-report

## 3.3.0

### Minor Changes

- b531205: ✨ added security headers
- 92b1b03: ✨ can now generate test reports without targets
- 730cac8: ✨ templates can be rendered using locales

### Patch Changes

- 7dedf0c: 🚑 fixed crash at startup
- Updated dependencies [92b1b03]
- Updated dependencies [730cac8]
  - @ezreeport/models@0.2.0
  - @ezreeport/database@1.4.0
  - @ezreeport/heartbeats@0.0.2
  - @ezreeport/rpc@0.0.2

## 3.3.0-rc.0

### Minor Changes

- b531205: ✨ added security headers
- 92b1b03: ✨ can now generate test reports without targets
- 730cac8: ✨ templates can be rendered using locales

### Patch Changes

- Updated dependencies [92b1b03]
- Updated dependencies [730cac8]
  - @ezreeport/models@0.2.0-rc.0
  - @ezreeport/database@1.4.0-rc.0
  - @ezreeport/heartbeats@0.0.2-rc.0
  - @ezreeport/rpc@0.0.2-rc.0

## 3.2.0

### Minor Changes

- 8c872a3: ✨ can now explicitly delay reports
- 6f7103f: ✨ added filters to task presets

### Patch Changes

- a4ad8b1: 🐛 fixed regressions introduced with offsets
- Updated dependencies [8c872a3]
- Updated dependencies [361bf43]
  - @ezreeport/database@1.3.0
  - @ezreeport/models@0.1.0
  - @ezreeport/heartbeats@0.0.1
  - @ezreeport/rpc@0.0.1

## 3.2.0-rc.1

### Patch Changes

- a4ad8b1: 🐛 fixed regressions introduced with offsets

## 3.2.0-rc.0

### Minor Changes

- 8c872a3: ✨ can now explicitly delay reports
- 6f7103f: ✨ added filters to task presets

### Patch Changes

- Updated dependencies [8c872a3]
- Updated dependencies [361bf43]
  - @ezreeport/database@1.3.0-rc.0
  - @ezreeport/models@0.1.0-rc.0
  - @ezreeport/heartbeats@0.0.1-rc.0
  - @ezreeport/rpc@0.0.1-rc.0

## 3.1.0

### Minor Changes

- b41d558: ✨ added filters on tasks cards/table components
- f73b1cd: ✨ template tags are now in their own table (must now include with templates to get them), new routes, methods and components are available to manage them

### Patch Changes

- 3f6a307: 🥅 added ttl for test generations
- Updated dependencies [566ae6c]
- Updated dependencies [f73b1cd]
  - @ezreeport/database@1.2.0

## 3.1.0-rc.0

### Minor Changes

- b41d558: ✨ added filters on tasks cards/table components
- f73b1cd: ✨ template tags are now in their own table (must now include with templates to get them), new routes, methods and components are available to manage them

### Patch Changes

- 3f6a307: 🥅 added ttl for test generations
- Updated dependencies [566ae6c]
- Updated dependencies [f73b1cd]
  - @ezreeport/database@1.2.0-rc.0

## 3.0.0

### Major Changes

- 40c3dd1: 🏗️ switched release management to changeset

### Minor Changes

- 4693218: ✨ heartbeats to external services now use dynamic frequency
- 60412e7: ✨ added rate limit on generation routes

### Patch Changes

- fd9c332: 🐛 fixed issue with task duplication
- 5e21ee6: 🐛 fixed formatting issue with validation errors
- a0711c7: 🐛 fixed issue with timeout errors still beign able to send heartbeats
- cfff397: 🐛 fixed pagination of task targets
- Updated dependencies [efedc28]
  - @ezreeport/database@1.1.0

## 3.0.0-rc.1

### Patch Changes

- a0711c7: 🐛 fixed issue with timeout errors still beign able to send heartbeats

## 3.0.0-rc.0

### Major Changes

- 40c3dd1: 🏗️ switched release management to changeset

### Minor Changes

- 4693218: ✨ heartbeats to external services now use dynamic frequency
- 60412e7: ✨ added rate limit on generation routes

### Patch Changes

- fd9c332: 🐛 fixed issue with task duplication
- 5e21ee6: 🐛 fixed formatting issue with validation errors
- cfff397: 🐛 fixed pagination of task targets
