oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ezreeport-admin
$ ezreeport-admin COMMAND
running command...
$ ezreeport-admin (--version)
ezreeport-admin/0.0.0 linux-x64 node-v18.19.0
$ ezreeport-admin --help [COMMAND]
USAGE
  $ ezreeport-admin COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ezreeport-admin hello PERSON`](#ezreeport-admin-hello-person)
* [`ezreeport-admin hello world`](#ezreeport-admin-hello-world)
* [`ezreeport-admin help [COMMANDS]`](#ezreeport-admin-help-commands)
* [`ezreeport-admin plugins`](#ezreeport-admin-plugins)
* [`ezreeport-admin plugins:install PLUGIN...`](#ezreeport-admin-pluginsinstall-plugin)
* [`ezreeport-admin plugins:inspect PLUGIN...`](#ezreeport-admin-pluginsinspect-plugin)
* [`ezreeport-admin plugins:install PLUGIN...`](#ezreeport-admin-pluginsinstall-plugin-1)
* [`ezreeport-admin plugins:link PLUGIN`](#ezreeport-admin-pluginslink-plugin)
* [`ezreeport-admin plugins:uninstall PLUGIN...`](#ezreeport-admin-pluginsuninstall-plugin)
* [`ezreeport-admin plugins reset`](#ezreeport-admin-plugins-reset)
* [`ezreeport-admin plugins:uninstall PLUGIN...`](#ezreeport-admin-pluginsuninstall-plugin-1)
* [`ezreeport-admin plugins:uninstall PLUGIN...`](#ezreeport-admin-pluginsuninstall-plugin-2)
* [`ezreeport-admin plugins update`](#ezreeport-admin-plugins-update)

## `ezreeport-admin hello PERSON`

Say hello

```
USAGE
  $ ezreeport-admin hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/ezpaarse-project/ezreeport/blob/v0.0.0/src/commands/hello/index.ts)_

## `ezreeport-admin hello world`

Say hello world

```
USAGE
  $ ezreeport-admin hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ ezreeport-admin hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/ezpaarse-project/ezreeport/blob/v0.0.0/src/commands/hello/world.ts)_

## `ezreeport-admin help [COMMANDS]`

Display help for ezreeport-admin.

```
USAGE
  $ ezreeport-admin help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for ezreeport-admin.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.12/src/commands/help.ts)_

## `ezreeport-admin plugins`

List installed plugins.

```
USAGE
  $ ezreeport-admin plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ ezreeport-admin plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/index.ts)_

## `ezreeport-admin plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ ezreeport-admin plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ ezreeport-admin plugins add

EXAMPLES
  $ ezreeport-admin plugins add myplugin 

  $ ezreeport-admin plugins add https://github.com/someuser/someplugin

  $ ezreeport-admin plugins add someuser/someplugin
```

## `ezreeport-admin plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ ezreeport-admin plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ ezreeport-admin plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/inspect.ts)_

## `ezreeport-admin plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ ezreeport-admin plugins install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ ezreeport-admin plugins add

EXAMPLES
  $ ezreeport-admin plugins install myplugin 

  $ ezreeport-admin plugins install https://github.com/someuser/someplugin

  $ ezreeport-admin plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/install.ts)_

## `ezreeport-admin plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ ezreeport-admin plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ ezreeport-admin plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/link.ts)_

## `ezreeport-admin plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ ezreeport-admin plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ezreeport-admin plugins unlink
  $ ezreeport-admin plugins remove

EXAMPLES
  $ ezreeport-admin plugins remove myplugin
```

## `ezreeport-admin plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ ezreeport-admin plugins reset
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/reset.ts)_

## `ezreeport-admin plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ ezreeport-admin plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ezreeport-admin plugins unlink
  $ ezreeport-admin plugins remove

EXAMPLES
  $ ezreeport-admin plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/uninstall.ts)_

## `ezreeport-admin plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ ezreeport-admin plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ezreeport-admin plugins unlink
  $ ezreeport-admin plugins remove

EXAMPLES
  $ ezreeport-admin plugins unlink myplugin
```

## `ezreeport-admin plugins update`

Update installed plugins.

```
USAGE
  $ ezreeport-admin plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.1.21/src/commands/plugins/update.ts)_
<!-- commandsstop -->
