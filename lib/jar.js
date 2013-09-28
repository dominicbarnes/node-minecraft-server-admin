var fs = require("fs"),
    async = require("async"),
    request = require("request");

exports.hasJar = function (callback) {
    return fs.exists(this.jar, callback.bind(this));
};

exports.linkJar = function (jar, callback) {
    var dest = this.jar;

    async.waterfall([
        function (done) {
            fs.exists(dest, function (exists) {
                done(null, exists);
            });
        },
        function (exists, done) {
            if (exists) {
                fs.unlink(dest, done);
            } else {
                process.nextTick(done);
            }
        },
        function (done) {
            fs.symlink(jar, dest, done);
        }
    ], callback.bind(this));
};

exports.downloadJar = function (url, callback) {
    var src = request(url);
    callback = callback.bind(this);

    src.pipe(fs.createWriteStream(this.jar));
    src.on("end", callback);
    src.on("error", callback);
};
