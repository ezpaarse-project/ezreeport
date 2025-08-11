ezreeport-admin
=================

CLI for managing ezreeport instance

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @ezpaarse-project/ezreeport-admin
$ ezreeport-admin COMMAND
running command...
$ ezreeport-admin (--version)
@ezpaarse-project/ezreeport-admin/1.2.0 linux-x64 node-v22.17.0
$ ezreeport-admin --help [COMMAND]
USAGE
  $ ezreeport-admin COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ezreeport-admin autocomplete [SHELL]`](#ezreeport-admin-autocomplete-shell)
* [`ezreeport-admin help [COMMAND]`](#ezreeport-admin-help-command)

## `ezreeport-admin autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ ezreeport-admin autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ ezreeport-admin autocomplete

  $ ezreeport-admin autocomplete bash

  $ ezreeport-admin autocomplete zsh

  $ ezreeport-admin autocomplete powershell

  $ ezreeport-admin autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.11/src/commands/autocomplete/index.ts)_

## `ezreeport-admin help [COMMAND]`

Display help for ezreeport-admin.

```
USAGE
  $ ezreeport-admin help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for ezreeport-admin.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.18/src/commands/help.ts)_
<!-- commandsstop -->
