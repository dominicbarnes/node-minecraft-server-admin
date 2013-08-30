# node-minecraft-server-admin

This module aims to encapsulate the management of a minecraft server, including
spinning up game instances, running backup/restore operations,  getting/setting
server.properties, white-list.txt, banned-*.txt, etc data, and more as time goes
on.

    npm install minecraft-server-admin

The export is a single constructor function:

    var Server = require("minecraft-server-admin");

## High-Level Overview

This module is very opinionated, and creates it's directory structure in a very
particular way to encapsulate all server information into a single directory.
(which is the dir supplied as the only argument to the Constructor function)

 * `backups/` - All server backups will reside here
 * `server/` - The minecraft server base dir will reside here (largely controlled by the minecraft server itself)
    * `world/` - Usually, this is the server's world data (can be configured via `server.properties`)
    * `minecraft_server.jar` - This is a symbolic link pointing to a `minecraft_server.jar` somewhere else on disk.
    * `banned-ips.txt` - Banned IP addresses
    * `banned-players.txt` - Banned player usernames
    * `white-list.txt` - Server whitelist (must be enabled in `server.properties`)
    * `opts.txt` - Server operator list
    * `server.properties` - See the [Minecraft Wiki](http://www.minecraftwiki.net/wiki/Server.properties)
    * `server.log` - Server console/log output
 * `config.json` - This contains configuration details for the server that exist outside the `server.properties`
   and friends. (such as the `java` command, allowed RAM, etc)

## API Documentation

### Server(dir)

The constructor requires a base directory as it's only parameter, this will be
the root directory for all the server's data/configuration/etc.

**Arguments**

 * `dir` - The path to the server's location on disk

### Server#dir

The absolute path location for this server, set by the `Constructor` (see above)

### Server#log

An instance of `file-class.File` (see [file-class](https://github.com/dominicbarnes/node-file-class))
pointing to `server/server.log`.

### Server#config

An instance of `file-class.JSONFile` (see [file-class](https://github.com/dominicbarnes/node-file-class))
pointing to `config.json`.

### Server#properties

An instance of `file-class.File` (see [file-class](https://github.com/dominicbarnes/node-file-class))
(using parse/stringify methods from [node-minecraft-server-properties](https://github.com/dominicbarnes/node-minecraft-server-properties))
pointing to [`server/server.properties`](http://www.minecraftwiki.net/wiki/Server.properties)

### Server#whitelist

An instance of `file-class.ListFile` (see [file-class](https://github.com/dominicbarnes/node-file-class))
pointing to `server/white-list.txt`.

### Server#operators

An instance of `file-class.ListFile` (see [file-class](https://github.com/dominicbarnes/node-file-class))
pointing to `server/ops.txt`.

### Server#banned.ips

An instance of `file-class.ListFile` (see [file-class](https://github.com/dominicbarnes/node-file-class))
pointing to `server/banned-ips.txt`.

### Server#banned.players

An instance of `file-class.ListFile` (see [file-class](https://github.com/dominicbarnes/node-file-class))
pointing to `server/banned-players.txt`.

### Server#backups

An instance of `dir-backup` (see [node-dir-backup](https://github.com/dominicbarnes/node-dir-backup))
that sets up a backup system with the `server/` dir as the source, and `backups/`
as the target.

### Server#game

This property is only set after a game has been started and begins to run
successfully, it is an instance of the
[node-minecraft-runner](https://github.com/dominicbarnes/node-minecraft-runner)
object, and exposes that entire API via this property. (this includes execute
server commands on the console, allows for listening to events that the server
emits, etc)

### Server#status

This is a `String` property that returns the current status of the running game,
or `"Stopped"` if no game is running.

### Server#jar

This is the filesystem location of the server's jar file, not following the symbolic link.
(ie: `server/minecraft_server.jar`)

### Server#file(location)

This function returns the absolute path to a file within the server's directory.

**Arguments**

 * `location` - The relative location of the file

**Returns** `String`

### Server#create(options, callback)

This creates the entire directory structure for a server, additional data passed
via arguments will be passed off to various other methods to creating configuration
files (such as `server.properties`)

**Arguments**

 * `options` - Hash of data for server defaults
    * `config` - `config.json` data (ie: `java`, `ram`)
    * `properties` - `server/server.properties` data
    * `whitelist` - `server/white-list.txt` data
    * `ops` - `server/ops.txt` data
    * `bannedPlayers` - `server/banned-players.txt` data
    * `bannedIps` - `server/banned-ips.txt` data
    * `jar` - `server/minecraft_server.jar` source location
 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

```javascript
var options = {
    properties: {
        // ... any excluded properties will likely be given defaults by the server
        "white-list": true
    },
    ops: [ "the-op" ]
};

server.create(options, function (err) {
    // err => null or Error()
});
```

### Server#del(callback)

This will destroy the entire directory structure for the server, if a game is
currently running, it will stop that instance first.

**Arguments**

 * `callback` - Arguments provided:
    * `err` Error object (if relevent)

### Server#exists(callback)

This will check for the existence of the server specified by this object.

**Arguments**

 * `callback` - Arguments provided:
    * `exists` - `Boolean` indicating the existence of the server's root dir

### Server#banned(callback)

This method is short-hand for reading both `banned-ips.txt` and `banned-players.txt`.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)
    * `banned` - `Object` of banned players/ips

### Server#nukeWorld(callback)

This method destroys the world data. (ie: the dir specified by the `level-name`
property in `server.properties`) This is a nice way to give your world a clean
slate without needing to reconfigure the entire server.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

### Server#linkJar(location, callback)

This method creates a symbolic link at `server/minecraft_server.jar` pointing
to the `location` specified.

**Arguments**

 * `location` - The absolute path to a valid `minecraft_server.jar` file
 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

### Server#downloadJar(url, callback)

This method downloads the file located at the specified `url` via HTTP
to `server/minecraft_server.jar`.

**Arguments**

 * `url` - The url pointing to a valid `minecraft_server.jar`
 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

### Server#start(callback)

This method will start the server instance, when the server has started properly,
it will set the `Server#game` property with the
[node-minecraft-runner](https://github.com/dominicbarnes/node-minecraft-runner)
instance object.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

### Server#stop(callback)

This method will stop the server instance, once the server stops/exits, the
`Server#game` property will be deleted.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

### Server#restart(callback)

This is short-hand for stopping and starting the server, any errors encountered
by either will be passed to the callback.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)

### Server#backup(callback)

This method handles running a backup for the server's `server/` directory. (to
exclude the backups themselves from being part of the backup) This method also
handles the necessary steps to take if the server is actively running, such as
broadcasting a message to the current users, forcing the server to flush data to
disk, etc.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)
    * `timestamp` - `Date` reflecting the time of the backup itself

### Server#restore(timestamp, callback)

This method restores a server from a previously-run backup. Unlike `Server#backup()`,
it **cannot** be run while the server is still actively running.

**Arguments**

 * `callback` - Arguments provided:
    * `err` - Error object (if relevent)
