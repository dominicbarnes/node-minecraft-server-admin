var Game = require("minecraft-runner");

exports.start = function (callback) {
    callback = callback.bind(this);
    var server = this;

    this.config.read(function (err, config) {
        var game = new Game(server.file("server"), server.jar, config);

        game.start(function (err) {
            if (err) return callback(err);

            server.game = game;
            return callback(null, game);
        });
    });
};

exports.stop = function (callback) {
    var server = this;
    callback = callback.bind(this);

    if (!this.running) return callback();

    this.game.stop(function (err) {
        if (err) return callback(err);

        delete server.game;
        callback();
    });
};

exports.restart = function (callback) {
    this.game.restart(callback.bind(this));
};
