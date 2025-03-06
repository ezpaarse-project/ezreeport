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
@ezpaarse-project/ezreeport-admin/1.1.0-rc.2 linux-x64 node-v20.17.0
$ ezreeport-admin --help [COMMAND]
USAGE
  $ ezreeport-admin COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ezreeport-admin autocomplete [SHELL]`](#ezreeport-admin-autocomplete-shell)
* [`ezreeport-admin config get [FIELD]`](#ezreeport-admin-config-get-field)
* [`ezreeport-admin config set KEY [VALUE]`](#ezreeport-admin-config-set-key-value)
* [`ezreeport-admin export [DIR]`](#ezreeport-admin-export-dir)
* [`ezreeport-admin help [COMMAND]`](#ezreeport-admin-help-command)
* [`ezreeport-admin import DIR`](#ezreeport-admin-import-dir)
* [`ezreeport-admin migrate apply DIR`](#ezreeport-admin-migrate-apply-dir)
* [`ezreeport-admin migrate list`](#ezreeport-admin-migrate-list)
* [`ezreeport-admin profile delete NAME`](#ezreeport-admin-profile-delete-name)
* [`ezreeport-admin profile list`](#ezreeport-admin-profile-list)
* [`ezreeport-admin profile load NAME`](#ezreeport-admin-profile-load-name)
* [`ezreeport-admin profile new NAME`](#ezreeport-admin-profile-new-name)
* [`ezreeport-admin profile unload NAME`](#ezreeport-admin-profile-unload-name)
* [`ezreeport-admin transfer`](#ezreeport-admin-transfer)

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

## `ezreeport-admin config get [FIELD]`

Show configs & profiles loaded

```
USAGE
  $ ezreeport-admin config get [FIELD] [-c <value>] [-p <value>] [--main]

ARGUMENTS
  FIELD  Field to show. Allow dot notation

FLAGS
  -c, --config=<value>   Path to config file
  -p, --profile=<value>  Profile name
      --[no-]main        Show main config

DESCRIPTION
  Show configs & profiles loaded

EXAMPLES
  $ ezreeport-admin config get
```

_See code: [src/commands/config/get.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/config/get.ts)_

## `ezreeport-admin config set KEY [VALUE]`

describe the command here

```
USAGE
  $ ezreeport-admin config set KEY [VALUE] [-c <value>] [-p <value>]

FLAGS
  -c, --config=<value>   Path to config file
  -p, --profile=<value>  Profile to set config for

DESCRIPTION
  describe the command here

EXAMPLES
  $ ezreeport-admin config set
```

_See code: [src/commands/config/set.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/config/set.ts)_

## `ezreeport-admin export [DIR]`

Export instance data into a dedicated folder

```
USAGE
  $ ezreeport-admin export [DIR] [-c <value>] [--namespaces] [--templates] [--tasks] [--taskPresets]

ARGUMENTS
  DIR  [default: data/2025-03-06_export] Folder to output data

FLAGS
  -c, --config=<value>    Path to config file
      --[no-]namespaces   Export namespaces
      --[no-]taskPresets  Export task presets
      --[no-]tasks        Export tasks
      --[no-]templates    Export templates

DESCRIPTION
  Export instance data into a dedicated folder

EXAMPLES
  $ ezreeport-admin export
```

_See code: [src/commands/export.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/export.ts)_

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

## `ezreeport-admin import DIR`

Import instance data from a dedicated folder

```
USAGE
  $ ezreeport-admin import DIR [-c <value>] [--namespaces] [--templates] [--tasks] [--taskPresets]

ARGUMENTS
  DIR  Exported data to read

FLAGS
  -c, --config=<value>    Path to config file
      --[no-]namespaces   Import namespaces
      --[no-]taskPresets  Import task presets
      --[no-]tasks        Import tasks
      --[no-]templates    Import templates

DESCRIPTION
  Import instance data from a dedicated folder

EXAMPLES
  $ ezreeport-admin import
```

_See code: [src/commands/import.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/import.ts)_

## `ezreeport-admin migrate apply DIR`

Apply migrations to the instance, defaults to all migrations

```
USAGE
  $ ezreeport-admin migrate apply DIR [-c <value>] [-f <value> | --to <value>] [-o <value>]

ARGUMENTS
  DIR  Exported data to read

FLAGS
  -c, --config=<value>  Path to config file
  -f, --file=<value>    Migration file to apply
  -o, --out=<value>     [default: data/2025-03-06_migrate] Folder to output data
      --to=<value>      Targeted version to migrate to

DESCRIPTION
  Apply migrations to the instance, defaults to all migrations

EXAMPLES
  $ ezreeport-admin migrate apply
```

_See code: [src/commands/migrate/apply.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/migrate/apply.ts)_

## `ezreeport-admin migrate list`

List migrations available for instance or a data directory

```
USAGE
  $ ezreeport-admin migrate list [-c <value>] [-d <value>] [-a]

FLAGS
  -a, --all             List all migrations
  -c, --config=<value>  Path to config file
  -d, --dir=<value>     Exported data to read

DESCRIPTION
  List migrations available for instance or a data directory

EXAMPLES
  $ ezreeport-admin migrate list
```

_See code: [src/commands/migrate/list.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/migrate/list.ts)_

## `ezreeport-admin profile delete NAME`

Delete profile and unload it if needed

```
USAGE
  $ ezreeport-admin profile delete NAME [-c <value>]

ARGUMENTS
  NAME  Profile name

FLAGS
  -c, --config=<value>  Path to config file

DESCRIPTION
  Delete profile and unload it if needed

EXAMPLES
  $ ezreeport-admin profile delete
```

_See code: [src/commands/profile/delete.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/profile/delete.ts)_

## `ezreeport-admin profile list`

List available profiles

```
USAGE
  $ ezreeport-admin profile list [-c <value>]

FLAGS
  -c, --config=<value>  Path to config file

DESCRIPTION
  List available profiles

EXAMPLES
  $ ezreeport-admin profile list
```

_See code: [src/commands/profile/list.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/profile/list.ts)_

## `ezreeport-admin profile load NAME`

Load profile

```
USAGE
  $ ezreeport-admin profile load NAME [-c <value>] [-p <value>]

ARGUMENTS
  NAME  Profile name

FLAGS
  -c, --config=<value>    Path to config file
  -p, --priority=<value>  Priority of profile. Higher priority profiles will be loaded first. Default to highest one

DESCRIPTION
  Load profile

EXAMPLES
  $ ezreeport-admin profile load
```

_See code: [src/commands/profile/load.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/profile/load.ts)_

## `ezreeport-admin profile new NAME`

Create a new profile

```
USAGE
  $ ezreeport-admin profile new NAME [-c <value>] [-f <value>] [--load] [--priority <value>] [--url <value>]
    [--key <value>] [--admin <value>]

ARGUMENTS
  NAME  Profile name

FLAGS
  -c, --config=<value>    Path to config file
  -f, --file=<value>      Read config from a file
      --admin=<value>     ezREEPORT administrator username
      --key=<value>       ezREEPORT API Key
      --load              Load the profile after creating it
      --priority=<value>  Priority when loading the profile. If not set, it will be the highest priority
      --url=<value>       ezREEPORT API URL

DESCRIPTION
  Create a new profile

EXAMPLES
  $ ezreeport-admin profile new
```

_See code: [src/commands/profile/new.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/profile/new.ts)_

## `ezreeport-admin profile unload NAME`

Unload profile

```
USAGE
  $ ezreeport-admin profile unload NAME [-c <value>]

ARGUMENTS
  NAME  Profile name

FLAGS
  -c, --config=<value>  Path to config file

DESCRIPTION
  Unload profile

EXAMPLES
  $ ezreeport-admin profile unload
```

_See code: [src/commands/profile/unload.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/profile/unload.ts)_

## `ezreeport-admin transfer`

Transfer first profile's to a second profile's instance

```
USAGE
  $ ezreeport-admin transfer [-c <value>] [--namespaces] [--templates] [--tasks] [--taskPresets]

FLAGS
  -c, --config=<value>    Path to config file
      --[no-]namespaces   Transfer namespaces
      --[no-]taskPresets  Transfer task presets
      --[no-]tasks        Transfer tasks
      --[no-]templates    Transfer templates

DESCRIPTION
  Transfer first profile's to a second profile's instance

EXAMPLES
  $ ezreeport-admin transfer
```

_See code: [src/commands/transfer.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.1.0-rc.2/src/commands/transfer.ts)_
<!-- commandsstop -->
