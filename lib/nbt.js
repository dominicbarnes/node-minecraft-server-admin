var fs    = require("fs"),
    path  = require("path"),
    zlib  = require("zlib"),
    async = require("async"),
    glob  = require("glob"),
    nbt   = require("nbt");

exports.players = function (callback) {
    var server = this;

    async.waterfall([
        function (done) {
            server.properties.read(done);
        },
        function (props, done) {
            var location = path.join("server", props["level-name"], "players");

            glob("*.dat", { cwd: server.file(location) }, done);
        },
        function (players, done) {
            done(null, players.map(function (player) {
                return path.basename(player, ".dat");
            }));
        }
    ], callback.bind(this));
};

exports.playerData = function (player, callback) {
    var server = this;
    callback = callback.bind(this);

    async.waterfall([
        function (done) {
            server.properties.read(done);
        },
        function (props, done) {
            var lvl = props["level-name"],
                location = path.join("server", lvl, "players", player + ".dat");

            fs.readFile(server.file(location), done);
        },
        function (data, done) {
            zlib.gunzip(data, done);
        }
    ], function (err, results) {
        if (err) return callback(err);

        callback(null, nbt.parse(results));
    });
};
