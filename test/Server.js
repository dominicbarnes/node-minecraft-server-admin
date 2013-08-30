var fs      = require("fs"),
    path    = require("path"),
    expect  = require("expect.js"),
    async   = require("async"),
    File    = require("file-class"),
    Backup  = require("dir-backup"),
    Server  = require("../"),
    support = path.join(__dirname, "support"),
    util    = require("./support/util"),
    jar     = path.join(support, "minecraft_server.jar");

describe("Server", function () {
    var server = new Server(path.join(support, "server"));

    before(function (done) {
        this.timeout("10s");

        async.series([
            function (done) {
                server.del(function () {
                    done();
                });
            },
            function (done) {
                util.downloadJar(jar, done);
            },
            function (done) {
                server.create({ jar: jar }, done);
            }
        ], done);
    });

    after(function (done) {
        server.del(done);
    });

    describe("constructor", function () {
        it("should assign some properties", function () {
            expect(server).to.have.property("dir", path.join(support, "server"));

            expect(server.properties).to.be.a(File);
            expect(server.config).to.be.a(File.JSONFile);
            expect(server.whitelist).to.be.a(File.ListFile);
            expect(server.operators).to.be.a(File.ListFile);
            expect(server.banned.ips).to.be.a(File.ListFile);
            expect(server.banned.players).to.be.a(File.ListFile);
            expect(server.log).to.be.a(File);
            expect(server.backups).to.be.a(Backup);
        });
    });

    describe("#file()", function () {
        it("should return a path to a file inside the server dir", function () {
            var file = "test/file.txt";
            expect(server.file(file)).to.be(path.join(server.dir, file));
        });
    });

    describe("#create()", function () {
        it("should create some files and directories", function (done) {
            async.every([
                "backups/",
                "craftmin.json",
                "server/server.properties",
                "server/white-list.txt",
                "server/ops.txt",
                "server/banned-ips.txt",
                "server/banned-players.txt"
            ], function (file, done) {
                fs.exists(server.file(file), done);
            }, function (result) {
                expect(result).to.be.true;
                done();
            });
        });

        it("should run the callback in the context of the server object", function (done) {
            server.create(function () {
                expect(this).to.equal(server);
                done();
            });
        });
    });

    describe("#del()", function () {
        var server = new Server(path.join(support, "del-server"));

        before(function (done) {
            server.create(done);
        });

        it("should delete the entire dir", function (done) {
            server.del(function (err) {
                if (err) return done(err);

                fs.exists(server.dir, function (exists) {
                    expect(exists).to.be.false;
                    done();
                });
            });
        });

        it("should run the callback in the context of the server object", function (done) {
            server.del(function () {
                expect(this).to.equal(server);
                done();
            });
        });
    });

    describe("#exists()", function () {
        var dne = new Server(path.join(support, "does-not-exist"));

        it("should be false if the directory does not exist", function (done) {
            dne.exists(function (exists) {
                expect(exists).to.be.false;
                done();
            });
        });

        it("should run the callback in the context of the server object", function (done) {
            server.exists(function () {
                expect(this).to.equal(server);
                done();
            });
        });
    });

    describe("#start()", function () {
        this.timeout("15s");

        afterEach(function (done) {
            server.stop(done);
        });

        it("should create a new game property", function (done) {
            server.start(function (err) {
                if (err) return done(err);

                expect(this).to.have.property("game");
                done();
            });
        });

        it("should run the callback in the context of the server object", function (done) {
            server.start(function () {
                expect(this).to.equal(server);
                done();
            });
        });

        it("should remove the game property if an error is encountered", function (done) {
            fs.unlink(server.file("server/minecraft_server.jar"), function (err) {
                if (err) return done(err);

                server.start(function (err) {
                    expect(err).to.be.ok();
                    expect(server).to.not.have.property("game");

                    server.linkJar(jar, done);
                });
            });
        });
    });

    describe("#stop()", function () {
        this.timeout("15s");

        beforeEach(function (done) {
            server.start(done);
        });

        it("should remove the game property", function (done) {
            server.stop(function (err) {
                if (err) return done(err);

                expect(server).to.not.have.property("game");
                done();
            });
        });

        it("should run the callback in the context of the server object", function (done) {
            server.stop(function () {
                expect(this).to.equal(server);
                done();
            });
        });
    });

    describe("#restart()", function () {
        this.timeout("15s");

        beforeEach(function (done) {
            server.start(done);
        });

        after(function (done) {
            server.stop(done);
        });

        it("should run the callback in the context of the server object", function (done) {
            server.restart(function () {
                expect(this).to.equal(server);
                done();
            });
        });
    });

    describe("#backup()", function () {
        this.timeout("5s");

        before(function (done) {
            server.start(done);
        });

        after(function (done) {
            server.stop(done);
        });

        it("should be able to work even while server is running", function (done) {
            this.timeout("10s");

            async.waterfall([
                function (done) {
                    server.backup(done);
                },
                function (date, done) {
                    server.backups.exists(date, function (exists) {
                        expect(exists).to.be.true;
                        done();
                    });
                }
            ], done);
        });
    });

    describe("#restore()", function () {
        this.timeout("5s");

        before(function (done) {
            server.start(done);
        });

        after(function (done) {
            server.stop(done);
        });

        it("should not allow a restore while the server is still running", function (done) {
            server.restore((new Date()).getTime(), function (err) {
                expect(err).to.be.ok();
                done();
            });
        });
    });

    describe("#nukeWorld()", function () {
        it("should delete the server/world folder", function (done) {
            server.nukeWorld(function (err) {
                if (err) return done(err);

                fs.exists(server.file("server/world"), function (exists) {
                    expect(exists).to.be.false;
                    done();
                });
            });
        });
    });

    describe("#status", function () {
        after(function (done) {
            this.timeout("15s");
            server.stop(done);
        });

        it("should return 'Stopped' when no game is running", function () {
            expect(server.status).to.equal("Stopped");
        });

        it("should return whatever the game's status is when running", function (done) {
            this.timeout("10s");

            server.start(function (err) {
                if (err) return done(err);

                expect(server.status).to.equal("Running");
                done();
            });
        });
    });

    describe("#linkJar()", function () {
        before(function (done) {
            fs.unlink(server.jar, function () {
                done();
            });
        });

        beforeEach(function (done) {
            server.linkJar(jar, done);
        });

        afterEach(function (done) {
            fs.unlink(server.jar, done);
        });

        it("should create a symbolic link", function (done) {
            fs.lstat(server.jar, function (err, stat) {
                if (err) return done(err);

                expect(stat.isSymbolicLink()).to.be(true);
                done();
            });
        });

        it("should point that symbolic link to the downloaded jar", function (done) {
            fs.stat(server.jar, function (err, stat) {
                if (err) return done(err);

                expect(stat.isFile()).to.be(true);
                done();
            });
        });
    });

    describe("#downloadJar()", function () {
        before(function (done) {
            fs.unlink(server.jar, function () {
                done();
            });
        });

        beforeEach(function (done) {
            this.timeout("5s");
            server.downloadJar(util.url, done);
        });

        afterEach(function (done) {
            fs.unlink(server.jar, done);
        });

        it("should download a new file to server/minecraft_server.jar", function (done) {
            fs.stat(server.jar, function (err, stat) {
                if (err) return done(err);

                expect(stat.isFile()).to.be(true);
                done();
            });
        });
    });
});
