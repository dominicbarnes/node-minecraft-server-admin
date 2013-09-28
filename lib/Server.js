var fs     = require("fs"),
    path   = require("path"),
    async  = require("async"),
    Backup = require("dir-backup"),
    File   = require("file-class"),
    _      = require("lodash"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    props  = require("minecraft-server-properties");

function Server(dir) {
    this.dir = dir;

    this.log = new File(this.file("server/server.log"));
    this.config = new File.JSONFile(this.file("config.json"));
    this.properties = new File(this.file("server/server.properties"), props);
    this.whitelist = new File.ListFile(this.file("server/white-list.txt"));
    this.operators = new File.ListFile(this.file("server/ops.txt"));
    this.banned = {
        ips:     new File.ListFile(this.file("server/banned-ips.txt"), { ignore: "#" }),
        players: new File.ListFile(this.file("server/banned-players.txt"), { ignore: "#" })
    };

    this.backups = new Backup(this.file("server"), this.file("backups"));
}

Object.defineProperty(Server.prototype, "running", {
    get: function () {
        return !!this.game;
    }
});

Object.defineProperty(Server.prototype, "status", {
    get: function () {
        return this.running ? this.game.status : "Stopped";
    }
});

Object.defineProperty(Server.prototype, "jar", {
    get: function () {
        return this.file("server/minecraft_server.jar");
    }
});

Server.prototype.file = function (file) {
    return path.join(this.dir, file);
};

Server.prototype.create = function (data, callback) {
    if (!callback) {
        callback = data;
        data     = {};
    }

    var server = this;
    callback = callback.bind(this);

    this.exists(function (exists) {
        if (exists) return callback(new Error("already exists"));

        mkdirp(this.file("server"), function (err) {
            if (err) return callback(err);

            async.parallel({
                config: function (done) {
                    server.config.write(data.config || {}, done);
                },
                properties: function (done) {
                    if (data.properties) {
                        server.properties.write(data.properties, done);
                    } else {
                        server.properties.empty(done);
                    }
                },
                log: function (done) {
                    server.log.empty(done);
                },
                whitelist: function (done) {
                    if (data.whitelist) {
                        server.whitelist.write(data.whitelist, done);
                    } else {
                        server.whitelist.empty(done);
                    }
                },
                ops: function (done) {
                    if (data.ops) {
                        server.operators.write(data.ops, done);
                    } else {
                        server.operators.empty(done);
                    }
                },
                bannedPlayers: function (done) {
                    if (data.banned && data.banned.players) {
                        server.banned.players.write(data.banned.players, done);
                    } else {
                        server.banned.players.empty(done);
                    }
                },
                bannedIps: function (done) {
                    if (data.banned && data.banned.ips) {
                        server.banned.ips.write(data.banned.ips, done);
                    } else {
                        server.banned.ips.empty(done);
                    }
                },
                backups: function (done) {
                    mkdirp(server.file("backups"), done);
                },
                jar: function (done) {
                    if (data.jar) {
                        server.linkJar(data.jar, done);
                    } else {
                        process.nextTick(done);
                    }
                }
            }, callback);
        });
    });

    return this;
};

Server.prototype.del = function (callback) {
    callback = callback.bind(this);

    if (this.running) {
        this.stop(function (err) {
            if (err) return callback(err);

            this.del(callback);
        });
    } else {
        rimraf(this.dir, function (err) {
            if (err && err.code !== "ENOENT") {
                return callback(err);
            }

            callback();
        });
    }

    return this;
};

Server.prototype.exists = function (callback) {
    fs.exists(this.dir, callback.bind(this));
};

Server.prototype.getBanned = function (callback) {
    var server = this;

    async.parallel({
        ips: function (done) {
            server.banned.ips.read(done);
        },
        players: function (done) {
            server.banned.players.read(done);
        }
    }, callback.bind(this));
};

Server.prototype.nukeWorld = function (callback) {
    var server = this;
    callback = callback.bind(this);

    async.waterfall([
        function (done) {
            server.properties.read(done);
        },
        function (properties, done) {
            var dir = server.file("server/" + properties["level-name"]);

            rimraf(dir, done);
        }
    ], callback.bind(this));
};

_.extend(Server.prototype,
    require("./game"),
    require("./jar"),
//    require("./nbt"),
    require("./backups")
);

module.exports = Server;
