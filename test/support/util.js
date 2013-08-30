var fs      = require("fs"),
    path    = require("path"),
    async   = require("async"),
    mkdirp  = require("mkdirp"),
    request = require("request");

exports.url = "https://s3.amazonaws.com/MinecraftDownload/launcher/minecraft_server.jar";

exports.downloadJar = function (dest, callback) {
    async.waterfall([
        function (done) {
            mkdirp(path.dirname(dest), function (err) {
                if (err) return done(err);

                done();
            });
        },
        function (done) {
            fs.exists(dest, function (exists) {
                done(null, exists);
            });
        },
        function (exists, done) {
            if (exists) return process.nextTick(done);

            var req = request(exports.url);
            req.pipe(fs.createWriteStream(dest));
            req.on("end", done);
        }
    ], callback);
};
