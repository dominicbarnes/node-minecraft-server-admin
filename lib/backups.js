var async = require("async");

exports.backup = function (callback) {
    var server  = this,
        game    = this.game,
        running = this.running;

    callback = callback.bind(this);

    function complete(err, date) {
        if (err) return callback(err);
        if (running) game.say("Server Backup Complete");

        callback(null, date);
    }

    if (running) {
        game.say("Server Backup Happening Now");

        async.waterfall([
            function (done) {
                game.once("saveoff", done).command("save-off");
            },
            function (done) {
                setTimeout(done, 500);
            },
            function (done) {
                game.once("saved", done).command("save-all");
            },
            function (done) {
                setTimeout(done, 5000);
            },
            function (done) {
                server.backups.backup(done);
            },
            function (date, done) {
                game.once("saveon", function () {
                    done(null, date);
                }).command("save-on");
            }
        ], complete);
    } else {
        this.backups.backup(complete);
    }
};

exports.restore = function (timestamp, callback) {
    callback = callback.bind(this);

    if (this.running) {
        return callback(new Error("Server is still running"));
    }

    this.backups.restore(timestamp, callback);
};
