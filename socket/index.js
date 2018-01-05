var users = require('../models/users');
var relations = require('../models/relations');
var historys = require('../models/historys');
var messages = require('../models/messages');
var helpers = require('./sockethelpers');
exports.register = function (server, options, next) {
    var io = require('socket.io')(server.listener);
    io.on('connection', function (socket) {
        socket.on('disconnect', function (data, fn) {
            helpers.connectionOffline(socket.id, function (onlineMatches, ronid) {
                for (var i = 0; i < onlineMatches.length; i++) {
                    io.sockets.in(onlineMatches[i]._id).emit('private', {dis: ronid});
                }
            });
        });
        socket.on('con', function (ronid, fn) {
            helpers.connectionOnline(ronid, socket.id, function (onlineMatches) {
                for (var i = 0; i < onlineMatches.length; i++) {
                    io.sockets.in(onlineMatches[i]._id).emit('private', {con: ronid});
                }
            });
            this.join(ronid);
            fn('joined');
        });

        socket.on('msg', function (data)
        {
            users.findOne({
                _id: data.from
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                if (doc === null) {
                    fn("fail");
                } else {
                    relations.findOne({
                        profileId: data.to,
                        match: true
                    }, function (err, docr) {
                        if (err) {
                            console.log(err);
                        }
                        if (docr !== null) {

                            users.update({$or: [{_id: data.to}, {_id: data.from}]}, {
                                lastmessage: data.msg,
                                lastmessageDatetime: new Date()
                            }, {multi: true, new : true}
                            , function (err, docu) {
                                if (err) {
                                    console.log(err);
                                }
                                if (docu !== null) {
                                    var message = new messages();
                                    message.to = data.to;
                                    message.from = data.from;
                                    message.message = data.msg;
                                    message.save(function (err) {
                                        if (err) {
                                            return err;
                                        }
                                        console.log(data);
                                        data.pic1 = doc.pictures.pic1;
                                        io.sockets.in(data.to).emit('private', {msg: data});
                                        console.log("sent to: " + data.to);
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
        socket.on('match', function (data)
        {
            relations.findOne({profileId: data.from,
                match: true}).then(function (Relation) {
                return users.findOne({_id: Relation.profileId}).select('_id name pictures.isNull1 status');
            }).then(function (callInfo) {
                console.log("Call69: " + callInfo.pictures.isNull1 + " " + callInfo.status);
                var dataout = {name: callInfo.name, from: data.from, isNull1: callInfo.pictures.isNull1, online: callInfo.status};
                console.log(dataout);
                io.sockets.in(data.to).emit('private', {match: dataout});
            });
        });
        socket.on('call', function (data)
        {
            relations.findOne({profileId: data.from,
                match: true}).then(function (Relation) {
                //console.log(Relation);
                //console.log(Relation.profileId);
                return users.findOne({_id: Relation.profileId}).select('_id name pictures.pic1');
            }).then(function (callInfo) {
                io.sockets.in(data.to).emit('private', {call: callInfo});
            });
        });
        socket.on('answer', function (data)
        {
            relations.findOne({
                profileId: data.from,
                match: true
            }, function (err, docr) {
                if (err) {
                    console.log(err);
                }
                if (docr !== null) {
                    var dataout = {name: docr.name, from: data.from};
                    io.sockets.in(data.to).emit('private', {answer: dataout});
                    //console.log(data);
                }
            });
        });
        socket.on('reject', function (data)
        {
            relations.findOne({
                profileId: data.from,
                match: true
            }, function (err, docr) {
                if (err) {
                    console.log(err);
                }
                if (docr !== null) {
                    var dataout = {name: docr.name, from: data.from};
                    io.sockets.in(data.to).emit('private', {reject: dataout});
                }
            });
        });
        socket.on('randomstop', function (data, fn) {
            this.leave("random" + data);
            console.log('randomize left: ' + data);
            users.findById(data, function (err, doc) {
                if (err) {
                    return fn(err);
                }
                if (doc !== null) {
                    if (typeof (doc.randomize.auth) !== "undefined") {
                        if (doc.randomize.auth === 1) {
                            var randomize = {randomize: {auth: 1, status: 'stop', wait: null}};
                            users.findOneAndUpdate({_id: data}, randomize, {new : true}, function (err, doc2) {
                                if (err) {
                                    return fn(err);
                                }
                                if (doc2 !== null) {
                                    fn("success");
                                } else {
                                    fn("fail");
                                }
                            });
                        } else {
                            fn("fail");
                        }
                    } else {
                        fn("fail");
                    }
                }
            });
        });
        socket.on('randomstart', function (data, fn) {
            this.join("random" + data);
            console.log('randomize con: ' + data);
            users.findById(data, function (err, doc) {
                if (err) {
                    fn("fail");
                }
                if (doc !== null) {
                    if (doc.randomize.auth === 1 && doc.randomize.status !== 'connected') {
                        var randomize = {status: 1, randomize: {auth: 1, status: 'start', wait: Date.now()}};
                        users.findOneAndUpdate({_id: data}, randomize, {new : true}, function (err, doc2) {
                            if (err) {
                                fn("fail");
                            }
                            if (doc2 !== null) {
                                var nin = [data];
                                query = {_id: {$nin: nin}, "randomize.auth": 1, "randomize.status": 'start'};

                                if (doc2.randomizeFilters.filterAge) {
                                    var now = new Date();
                                    var lowYr = new Date();
                                    var highYr = new Date();
                                    lowYr.setYear(now.getYear() - doc2.settings.age_range.high);
                                    highYr.setYear(now.getYear() - doc2.settings.age_range.low);
                                    lowYr = new Date(lowYr.getFullYear() + '-01-01');
                                    highYr = new Date(highYr.getFullYear() + '-12-31');
                                    query['birthday'] = {$gt: lowYr, $lt: highYr};
                                }
                                if (doc2.randomizeFilters.filterInt) {
                                    switch (doc2.settings.preference) {
                                        case "males":
                                            query['gender'] = "male";
                                            break;
                                        case "females":
                                            query['gender'] = "female";
                                            break;
                                    }


                                }
                                users.find(
                                        query
                                        ).
                                        limit(30).
                                        exec(function (err, docm) {

                                            if (err) {
                                            }
                                            if (Object.keys(docm).length === 0) {
                                                fn("fail");
                                            } else {
                                                var contAge = false;
                                                var contInt = false;
                                                var contLoc = false;
                                                var contLoc2 = false;
                                                for (var index = 0; index < docm.length; ++index) {
                                                    //  console.log(docm[index].name);
                                                    if (docm[index].randomizeFilters.filterAge) {

                                                        var now = new Date();
                                                        var lowYr = new Date();
                                                        var highYr = new Date();
                                                        lowYr.setYear(now.getYear() - docm[index].settings.age_range.high);
                                                        highYr.setYear(now.getYear() - docm[index].settings.age_range.low);
                                                        lowYr = new Date(lowYr.getFullYear() + '-01-01');
                                                        highYr = new Date(highYr.getFullYear() + '-12-31');

                                                        if (doc2.birthday.getTime() > lowYr.getTime() && doc2.birthday.getTime() < highYr.getTime()) {
                                                            contAge = true;
                                                        }

                                                    } else {
                                                        contAge = true;
                                                    }

                                                    if (docm[index].randomizeFilters.filterInt) {
                                                        switch (docm[index].settings.preference) {
                                                            case "males":
                                                                if (doc2.gender == "male") {
                                                                    contInt = true;
                                                                }
                                                                break;
                                                            case "females":
                                                                if (doc2.gender == "female") {
                                                                    contInt = true;
                                                                }
                                                                break;
                                                            case "both":
                                                                contInt = true;
                                                                break;
                                                        }


                                                    } else {
                                                        contInt = true;
                                                    }

                                                    var today = new Date();
                                                    var birthDate = docm[index].birthday;
                                                    var age = today.getFullYear() - birthDate.getFullYear();
                                                    var m = today.getMonth() - birthDate.getMonth();
                                                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                                        age--;
                                                    }



                                                    if (doc2.randomizeFilters.filterLoc) {
                                                        var radlat1 = Math.PI * docm[index].settings.location.lat / 180;
                                                        var radlat2 = Math.PI * doc2.settings.location.lat / 180;
                                                        var theta = docm[index].settings.location.lng - doc2.settings.location.lng;
                                                        var radtheta = Math.PI * theta / 180;
                                                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                                                        dist = Math.acos(dist);
                                                        dist = dist * 180 / Math.PI;
                                                        dist = dist * 60 * 1.1515;
                                                        if (dist <= doc2.settings.distance) {
                                                            dist = Math.round(dist);
                                                            if (dist < 10) {
                                                                dist = '< 10';
                                                            }
                                                            contLoc = true;
                                                        }
                                                    } else {
                                                        contLoc = true;
                                                    }

                                                    if (docm[index].randomizeFilters.filterLoc) {
                                                        var radlat1 = Math.PI * docm[index].settings.location.lat / 180;
                                                        var radlat2 = Math.PI * doc2.settings.location.lat / 180;
                                                        var theta = docm[index].settings.location.lng - doc2.settings.location.lng;
                                                        var radtheta = Math.PI * theta / 180;
                                                        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                                                        dist = Math.acos(dist);
                                                        dist = dist * 180 / Math.PI;
                                                        dist = dist * 60 * 1.1515;
                                                        if (dist <= docm[index].settings.distance) {
                                                            dist = Math.round(dist);
                                                            if (dist < 10) {
                                                                dist = '< 10';
                                                            }
                                                            contLoc2 = true;
                                                        }
                                                    } else {
                                                        contLoc2 = true;
                                                    }
                                                    console.log((contAge + " " + contInt + " " + contLoc + " " + contLoc2));
                                                    if (contAge === true && contInt === true && contLoc === true && contLoc2 === true) {
                                                        doc3 = docm[index];
                                                        doc = doc2;
                                                        var randomroom = getRandom(18);
                                                        io.sockets.in('random' + doc._id).emit('randompairingprofile10sec', {id: doc3._id, name: doc3.name, pic: doc3.pictures});
                                                        io.sockets.in('random' + doc3._id).emit('randompairingprofile10sec', {id: doc._id, name: doc.name, pic: doc.pictures});
                                                        setTimeout(function () {
                                                            setTimeout(function () {

                                                                users.findOne({_id: doc._id}, function (err, doc4) {
                                                                    if (err) {
                                                                        fn("fail");
                                                                    }
                                                                    if (doc4.randomize.status !== "skip") {

                                                                        users.findOne({_id: doc3._id}, function (err, doc5) {
                                                                            if (err) {
                                                                                fn("fail");
                                                                            }
                                                                            if (doc5.randomize.status !== "skip") {

                                                                                users.findOneAndUpdate({_id: doc._id}, {randomize: {auth: 1, status: 'connected', wait: null}}, {new : true}, function (err, doc6) {
                                                                                    if (err) {
                                                                                        fn("fail");
                                                                                    }
                                                                                    if (doc6 !== null) {
                                                                                        io.sockets.in('random' + doc3._id).emit('randompairingcallstart', {room: randomroom, userId: doc._id});
                                                                                    }
                                                                                });
                                                                            } else {
                                                                                users.findOneAndUpdate({_id: doc3._id}, {randomize: {auth: 1, status: 'start', wait: null}}, {new : true}, function (err, doc7) {
                                                                                    if (err) {
                                                                                        fn("fail");
                                                                                    }
                                                                                    if (doc7 !== null) {
                                                                                        io.sockets.in('random' + doc._id).emit('randompairingskipped', {skipped: 'yes'});
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    } else {
                                                                        users.findOneAndUpdate({_id: doc._id}, {randomize: {auth: 1, status: 'start', wait: null}}, {new : true}, function (err, doc8) {
                                                                            if (err) {
                                                                                fn("fail");
                                                                            }
                                                                            if (doc8 !== null) {
                                                                                io.sockets.in('random' + doc3._id).emit('randompairingskipped', {skipped: 'yes'});
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }, 1000);
                                                            users.findOne({_id: doc3._id}, function (err, doc9) {
                                                                if (err) {
                                                                    fn("fail");
                                                                }
                                                                if (doc9.randomize.status !== "skip") {

                                                                    users.findOne({_id: doc._id}, function (err, doc10) {
                                                                        if (err) {
                                                                            fn("fail");
                                                                        }
                                                                        if (doc10.randomize.status !== "skip") {
                                                                            users.findOneAndUpdate({_id: doc3._id}, {randomize: {auth: 1, status: 'connected', wait: null}}, {new : true}, function (err, doc11) {
                                                                                if (err) {
                                                                                    fn("fail");
                                                                                }
                                                                                if (doc11 !== null) {
                                                                                    io.sockets.in('random' + doc._id).emit('randompairingcallstart', {room: randomroom, userId: doc3._id});
                                                                                    updateHistory(doc, doc3);
                                                                                    updateHistory(doc3, doc);
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                            fn("success");
                                                        }, 10000);
                                                        break;
                                                    }
                                                }
                                            }
                                        });
                            } else {
                                fn("fail");
                            }
                        });
                    } else {
                        fn("fail");
                    }
                } else {
                    fn("fail");
                }
            }
            );
        });
        socket.on('randomskip', function (data, fn) {
            console.log(data);
            users.findOneAndUpdate({_id: data}, {randomize: {auth: 1, status: 'skip', wait: null}}, {new : true}, function (err, doc5) {
                if (err) {
                    fn("fail");
                }
                if (doc5 !== null) {
                    fn("success");
                }
            });
        });

        socket.on('ranhistreq', function (data) {
            console.log('ranhistreg');
            console.log(data);
            historys.findOne({profileId: data.to, userId: data.from}).
                    exec(function (err, history) {
                        if (err) {
                            console.log(err);
                        }
                        if (history) {
                            historys.findOneAndUpdate({profileId: data.to, userId: data.from}, {like: true}, {new : true}, function (err) {
                                if (!err) {
                                    io.sockets.in(data.to).emit('private', {ranhistreq: data.from});
                                }
                            });
                        }
                    });
        });

        socket.on('randomstoppedtimer', function (data, fn) {
            historys.findOne({profileId: data.userId, userId: data.ronid}, function (err, doc) {
                if (err) {
                    return fn(err);
                }
                if (doc !== null) {
                    io.sockets.in('random'+data.userId).emit('ranstoppedtimer', {name: doc.name});
                       fn("success");
                }
            });
        });

    }
    );
    next();
};
exports.register.attributes = {
    name: 'hapi-chat'
};
function getRandom(length) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1));
}

function updateHistory(profile1, profile2) {
    historys.find({profileId: profile1._id}).sort('-date').
            exec(function (err, history) {
                if (err) {
                    console.log(err);
                }
                if (history) {
                    if (history.length > 4) {
                        historys.findOneAndRemove({_id: history[0]._id}, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }

                    historys.find({profileId: profile1._id, userId: profile2._id}).
                            exec(function (err, history2) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log(history2);
                                if (history2.length === 0) {

                                    var newhistory = new historys();
                                    newhistory.profileId = profile1._id;
                                    newhistory.userId = profile2._id;
                                    newhistory.name = profile2.name;
                                    newhistory.pic1 = profile2.pictures.pic1;
                                    newhistory.save(function (err) {
                                        if (err) {
                                            return err;
                                        }
                                    });

                                }
                            });
                }
            });
}