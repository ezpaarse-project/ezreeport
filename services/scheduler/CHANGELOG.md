# ezreeport-scheduler

## 1.3.0-rc.0

### Minor Changes

- 8c872a3: ✨ can now explicitly delay reports

### Patch Changes

- Updated dependencies [8c872a3]
- Updated dependencies [361bf43]
  - @ezreeport/database@1.3.0-rc.0
  - @ezreeport/models@0.1.0-rc.0
  - @ezreeport/crons@0.0.1-rc.0
  - @ezreeport/heartbeats@0.0.1-rc.0
  - @ezreeport/rpc@0.0.1-rc.0

## 1.2.0

### Minor Changes

- eedb481: ✨ dangling generations will be marked as "aborted" after scheduler starts

### Patch Changes

- 28f33fd: 🐛 fixed issue where activity is written multiple times after generation
- Updated dependencies [566ae6c]
- Updated dependencies [f73b1cd]
  - @ezreeport/database@1.2.0

## 1.2.0-rc.0

### Minor Changes

- eedb481: ✨ dangling generations will be marked as "aborted" after scheduler starts

### Patch Changes

- 28f33fd: 🐛 fixed issue where activity is written multiple times after generation
- Updated dependencies [566ae6c]
- Updated dependencies [f73b1cd]
  - @ezreeport/database@1.2.0-rc.0

## 1.1.0

### Minor Changes

- 4693218: ✨ heartbeats to external services now use dynamic frequency

### Patch Changes

- a0711c7: 🐛 fixed issue with timeout errors still beign able to send heartbeats
- Updated dependencies [efedc28]
  - @ezreeport/database@1.1.0

## 1.1.0-rc.1

### Patch Changes

- a0711c7: 🐛 fixed issue with timeout errors still beign able to send heartbeats

## 1.1.0-rc.0

### Minor Changes

- 4693218: ✨ heartbeats to external services now use dynamic frequency
