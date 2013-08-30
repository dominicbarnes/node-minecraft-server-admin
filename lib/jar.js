var fs = require("fs"),
    async = require("async"),
    request = require("request");

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
    request(url)
        .pipe(fs.createWriteStream(this.jar))
        .on("end", callback.bind(this));
};
