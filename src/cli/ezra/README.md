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

$ ezreeport-admin --version
ezreeport-admin/1.0.0 linux-x64 node-v18.19.0

$ ezreeport-admin --help [COMMAND]
CLI for managing ezreeport instance

VERSION
  ezreeport-admin/1.0.0 linux-x64 node-v18.19.0

USAGE
  $ ezreeport-admin [COMMAND]
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ezreeport-admin help [COMMANDS]`](#ezreeport-admin-help-commands)
* [`ezreeport-admin autocomplete`](#ezreeport-admin-autocomplete)
* [`ezreeport-admin autocomplete create`](#ezreeport-admin-autocomplete-create)
* [`ezreeport-admin autocomplete script`](#ezreeport-admin-autocomplete-script)
* [`ezreeport-admin export FOLDER`](#ezreeport-admin-export-folder)
* [`ezreeport-admin import FOLDER`](#ezreeport-admin-import-folder)
* [`ezreeport-admin transfer`](#ezreeport-admin-transfer)
* [`ezreeport-admin migrate list`](#ezreeport-admin-migrate-list)
* [`ezreeport-admin migrate apply FOLDER`](#ezreeport-admin-migrate-apply-folder)
* [`ezreeport-admin config get [PROPERTY]`](#ezreeport-admin-config-get-property)
* [`ezreeport-admin config set PROPERTY [VALUE]`](#ezreeport-admin-config-set-property-value)
* [`ezreeport-admin profile list`](#ezreeport-admin-profile-list)
* [`ezreeport-admin profile new NAME`](#ezreeport-admin-profile-new-name)
* [`ezreeport-admin profile load NAME`](#ezreeport-admin-profile-load-name)
* [`ezreeport-admin profile unload NAME`](#ezreeport-admin-profile-unload-name)
* [`ezreeport-admin profile delete NAME`](#ezreeport-admin-profile-delete-name)

## `ezreeport-admin help [COMMANDS]`

Display help for ezreeport-admin.

```
USAGE
  $ ezreeport-admin help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.12/src/commands/help.ts)_

## `ezreeport-admin autocomplete`

Display autocomplete installation instructions.

```
USAGE
  $ ezreeport-admin autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ ezreeport-admin autocomplete
  $ ezreeport-admin autocomplete bash
  $ ezreeport-admin autocomplete zsh
  $ ezreeport-admin autocomplete powershell
  $ ezreeport-admin autocomplete --refresh-cache
```

## `ezreeport-admin autocomplete create`

Create autocomplete setup scripts and completion functions.

```
USAGE
  $ ezreeport-admin autocomplete create

EXAMPLES
  $ ezreeport-admin autocomplete create
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/3.0.18/src/commands/autocomplete/index.ts)_

## `ezreeport-admin autocomplete script`

Outputs autocomplete config script for shells.

```
USAGE
  $ ezreeport-admin autocomplete script [SHELL]

ARGUMENTS
  SHELL  (zsh|bash|powershell) Shell type
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/3.0.18/src/commands/autocomplete/index.ts)_

## `ezreeport-admin export FOLDER`

Export instance data into a dedicated folder.

```
USAGE
  $ ezreeport-admin export [DIR] [-c <value>] [-o <value>] [--namespaces] [--templates] [--tasks] [--taskPresets]

ARGUMENTS
  DIR  [default: data/date_export] Folder to output data

FLAGS
  -c, --config=<value>    Path to config file
  -o, --out=<value>       [default: data/date_export] Folder to output data
      --[no-]namespaces   Export namespaces
      --[no-]taskPresets  Export task presets
      --[no-]tasks        Export tasks
      --[no-]templates    Export templates

EXAMPLES
  $ ezreeport-admin export
```

_See code: [src/commands/export.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/export.ts)_

## `ezreeport-admin import FOLDER`

Import instance data from a dedicated folder.

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

EXAMPLES
  $ ezreeport-admin import
```

_See code: [src/commands/import.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/import.ts)_


## `ezreeport-admin transfer`

Transfer first profile's to a second profile's instance.

```
USAGE
  $ ezreeport-admin transfer [-c <value>] [--namespaces] [--templates] [--tasks] [--taskPresets]

FLAGS
  -c, --config=<value>    Path to config file
      --[no-]namespaces   Transfer namespaces
      --[no-]taskPresets  Transfer task presets
      --[no-]tasks        Transfer tasks
      --[no-]templates    Transfer templates

EXAMPLES
  $ ezreeport-admin transfer
```

_See code: [src/commands/transfer.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/transfer.ts)_

## `ezreeport-admin migrate list`

List migrations available for instance or a data directory

```
USAGE
  $ ezreeport-admin migrate list [-c <value>] [-d <value>] [-a]

FLAGS
  -a, --all             List all migrations
  -c, --config=<value>  Path to config file
  -d, --dir=<value>     Exported data to read

EXAMPLES
  $ ezreeport-admin migrate list
```

_See code: [src/commands/migrate/list.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/migrate/list.ts)_

## `ezreeport-admin migrate apply FOLDER`

Apply migrations to the instance, defaults to all migrations.

```
USAGE
  $ ezreeport-admin migrate apply DIR [-c <value>] [-f <value> | --to <value>] [-o <value>]

ARGUMENTS
  DIR  Exported data to read

FLAGS
  -c, --config=<value>  Path to config file
  -f, --file=<value>    Migration file to apply
  -o, --out=<value>     [default: data/2024-05-28_migrate] Folder to output data
      --to=<value>      Targeted version to migrate to

EXAMPLES
  $ ezreeport-admin migrate apply
```

_See code: [src/commands/migrate/apply.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/migrate/apply.ts)_

## `ezreeport-admin config get PROPERTY`

Show configs & profiles loaded.

```
USAGE
  $ ezreeport-admin config get [FIELD] [-c <value>] [-p <value>] [--main]

ARGUMENTS
  FIELD  Field to show. Allow dot notation

FLAGS
  -c, --config=<value>   Path to config file
  -p, --profile=<value>  Profile name
      --[no-]main        Show main config

EXAMPLES
  $ ezreeport-admin config get
```

_See code: [src/commands/config/get.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/config/get.ts)_

## `ezreeport-admin config set PROPERTY VALUE`

Set property of a config.

```
USAGE
  $ ezreeport-admin config set KEY [VALUE] [-c <value>] [-p <value>]

FLAGS
  -c, --config=<value>   Path to config file
  -p, --profile=<value>  Profile to set config for

EXAMPLES
  $ ezreeport-admin config set
```

_See code: [src/commands/config/set.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/config/set.ts)_

## `ezreeport-admin profile list`

List migrations available for instance or a data directory

```
USAGE
  $ ezreeport-admin migrate list [-c <value>] [-d <value>] [-a]

FLAGS
  -a, --all             List all migrations
  -c, --config=<value>  Path to config file
  -d, --dir=<value>     Exported data to read

EXAMPLES
  $ ezreeport-admin migrate list
```

_See code: [src/commands/migrate/list.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/migrate/list.ts)_

## `ezreeport-admin migrate apply`

Apply migrations to the instance, defaults to all migrations

```
USAGE
  $ ezreeport-admin migrate apply DIR [-c <value>] [-f <value> | --to <value>] [-o <value>]

ARGUMENTS
  DIR  Exported data to read

FLAGS
  -c, --config=<value>  Path to config file
  -f, --file=<value>    Migration file to apply
  -o, --out=<value>     [default: data/2024-05-28_migrate] Folder to output data
      --to=<value>      Targeted version to migrate to

EXAMPLES
  $ ezreeport-admin migrate apply
```

_See code: [src/commands/migrate/apply.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/migrate/apply.ts)_

## `ezreeport-admin profile list`

List available profiles

```
USAGE
  $ ezreeport-admin profile list [-c <value>]

FLAGS
  -c, --config=<value>  Path to config file

EXAMPLES
  $ ezreeport-admin profile list
```

_See code: [src/commands/profile/list.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/profile/list.ts)_

## `ezreeport-admin profile new NAME`

Create a new profile

```
USAGE
  $ ezreeport-admin profile new NAME [-c <value>] [-f <value>] [--load] [--priority <value>] [--url <value>] [--key <value>] [--admin <value>]

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

EXAMPLES
  $ ezreeport-admin profile new
```

_See code: [src/commands/profile/new.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/profile/new.ts)_

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

EXAMPLES
  $ ezreeport-admin profile load
```

_See code: [src/commands/profile/load.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/profile/load.ts)_

## `ezreeport-admin profile unload NAME`

Unload profile

```
USAGE
  $ ezreeport-admin profile unload NAME [-c <value>]

ARGUMENTS
  NAME  Profile name

FLAGS
  -c, --config=<value>  Path to config file

EXAMPLES
  $ ezreeport-admin profile unload
```

_See code: [src/commands/profile/unload.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/profile/unload.ts)_

## `ezreeport-admin profile delete NAME`

Delete profile and unload it if needed

```
USAGE
  $ ezreeport-admin profile delete NAME [-c <value>]

ARGUMENTS
  NAME  Profile name

FLAGS
  -c, --config=<value>  Path to config file

EXAMPLES
  $ ezreeport-admin profile delete
```

_See code: [src/commands/profile/delete.ts](https://github.com/ezpaarse-project/ezreeport/blob/v1.0.0/src/commands/profile/delete.ts)_
<!-- commandsstop -->
