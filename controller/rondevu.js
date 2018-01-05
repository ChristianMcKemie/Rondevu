var users = require('../models/users');
var relations = require('../models/relations');
var historys = require('../models/historys');
var messages = require('../models/messages');
var reports = require('../models/reports');
var helpers = require('../helpers/helpers');
var graph = require('fbgraph');
var Common = require('./common');
var mongoose = require('mongoose');
var Config = require('../config');
exports.logout = {
    handler: function (request, reply) {



        // return reply('<pre>' + JSON.stringify(request.state['data'], null, 4) + '</pre>');

        if (typeof (request.state['data']) !== 'undefined') {

            request.state['data'].params = {};
            request.state['data'].params.host = Config.server.host;
            request.state['data'].params.name = Config.server.name;

            if (typeof (request.state['data'].isAuthenticated) !== 'undefined') {
                if (request.state['data'].isAuthenticated === true) {
                    request.state['data'].isAuthenticated = false;
                    return reply().redirect('/').state('data', request.state['data']);
                } else {
                    return reply.view('rondevu_index', request.state['data']);
                }
            } else {
                return reply.view('rondevu_index', request.state['data']);
            }
        } else {

            request.state['data'] = {};
            request.state['data'].params = {};
            request.state['data'].params.host = Config.server.host;
            request.state['data'].params.name = Config.server.name;

            return reply.view('rondevu_index', request.state['data']);
        }
    }};
exports.login = {
    handler: function (request, reply) {



        //return reply('<pre>' + JSON.stringify(request.state['data'], null, 4) + '</pre>');

        if (typeof (request.state['data']) !== 'undefined') {

            request.state['data'].params = {};
            request.state['data'].params.host = Config.server.host;
            request.state['data'].params.name = Config.server.name;

            if (typeof (request.state['data'].isAuthenticated) !== 'undefined') {
                if (request.state['data'].isAuthenticated === true) {
                    return reply().redirect('/home');
                } else {
                    return reply.view('rondevu_index', request.state['data']);
                }
            } else {
                return reply.view('rondevu_index', request.state['data']);
            }
        } else {

            request.state['data'] = {};
            request.state['data'].params = {};
            request.state['data'].params.host = Config.server.host;
            request.state['data'].params.name = Config.server.name;

            return reply.view('rondevu_index', request.state['data']);
        }
    }};
exports.privacy = {
    handler: function (request, reply) {
        return reply.view('rondevu_privacy');
    }};
exports.facebookauth = {
    auth: {
        strategy: 'facebook',
        mode: 'try'
    },
    handler: function (request, reply) {
        if (!request.auth.isAuthenticated) {
            return reply().redirect('/logout');
        } else {
            users.findOne({
                fbid: request.auth.credentials.profile.id
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {
                    request.auth.existing = true;
                    request.auth.userstate = "active";
                    request.auth.ronid = doc._id;
                    request.auth.likes = [];
                    relations.find({
                        fbid1: request.auth.credentials.profile.id
                    }, function (err, docr) {
                        if (err) {
                        }
                        if (docr !== null) {
                        }
                    });
                    return reply().redirect('/home').state('data', request.auth);
                } else {
                    //new user
                    var user = new users();
                    user.fbid = request.auth.credentials.profile.id;
                    user.name = request.auth.credentials.profile.raw.first_name;
                    user.gender = request.auth.credentials.profile.raw.gender;
                    user.education = "";
                    if (request.auth.credentials.profile.raw.education) {
                        if (Object.keys(request.auth.credentials.profile.raw.education).length > 0)
                        {
                            var educationObject = request.auth.credentials.profile.raw.education;
                            var highestEd = educationObject[Object.keys(educationObject)[Object.keys(educationObject).length - 1]].school.name;
                            user.education = highestEd;
                        }
                    }
                    user.birthday = new Date(request.auth.credentials.profile.raw.birthday); //request.auth.credentials.profile.raw.birthday;
                    if (request.auth.credentials.profile.raw.gender === "male") {
                        var preference = 'females';
                    } else {
                        var preference = 'males';
                    }
                    user.settings = {
                        preference: preference,
                        distance: 30,
                        age_range: {low: 18, high: 25},
                        location: {lat: 40.699513, lng: -74.018789}}; //NYC
                    user.save(function (err, user) {
                        if (err) {
                            return err;
                        }
                        request.auth.userstate = "new";
                        request.auth.new = true;
                        request.auth.ronid = user._id;
                        GetalltheFBprofileImages(user, request);
                        return reply().redirect('/new').state('data', request.auth);
                    });
                }
            });
        }
    }};
exports.new = {handler: function (request, reply) {
        if (!request.state['data'] || request.state['data'].isAuthenticated !== true) {
            return reply().redirect('/logout');
        } else {
            if (request.state['data'].userstate !== "new") {
                request.state['data'].existing = true;
                return reply().redirect('/home').state('data', request.state['data']);
            } else {
                request.state['data'].new = true;
                return reply.view('rondevu_newuser', request.state['data']);
            }
        }
    }};
exports.home = {
    handler: function (request, reply) {

        if (!request.state['data'] || request.state['data'].isAuthenticated !== true) {
            return reply().redirect('/logout');
        } else {
            var randomize = {randomize: {auth: 1, status: '', wait: null}};
            users.findOneAndUpdate({fbid: request.state['data'].credentials.profile.id}, randomize, {new : true}, function (err, doc) { //take user out of randomize
                if (err) {
                    request.state['data'].isAuthenticated = false;
                    return reply().redirect('/logout');
                }
                if (doc !== null) {
                    if (doc.banned === true) {
                        return reply().redirect('/logout');
                    }
                    //relations.find({fbid1: request.state['data'].credentials.profile.id, match: true, unmatched: 0}).then(function (Relation) {
                    relations.aggregate([
                        {$match: {fbid1: request.state['data'].credentials.profile.id, match: true}},
                        {$lookup:
                                    {
                                        from: "users",
                                        localField: "profileId",
                                        foreignField: "_id",
                                        as: "user"
                                    }
                        },
                        {$unwind: {path: "$user", "preserveNullAndEmptyArrays": true}},

                        {$project: {"_id": "$user._id", "name": "$user.name", "status": "$user.status", "pic1": "$user.pictures.pic1"}}
                    ]).then(function (Relation) {

                        request.state['data'].matches = Relation;

                        var jobQueries = [];

                        Relation.forEach(function (u) {
                            jobQueries.push(
                                    messages.findOne({$or: [{to: u._id}, {from: u._id}]}).sort('-datetime').select('message datetime'));
                        });
                        return Promise.all(jobQueries);
                    }).then(function (listOfMessages) {
                        // console.log(listOfMessages);

                        for (var i = 0; i < request.state['data'].matches.length; i++) {
                            console.log(request.state['data'].matches[i].status);
                            if (request.state['data'].matches[i].status !== true) {
                                request.state['data'].matches[i].offline = true;
                            }
                            if (listOfMessages[i]) {
                                request.state['data'].matches[i].lastmessage = listOfMessages[i].message;

                                if (request.state['data'].matches[i].lastmessage) {
                                    if (request.state['data'].matches[i].lastmessage.length > 12) {
                                        request.state['data'].matches[i].lastmessage = request.state['data'].matches[i].lastmessage.substr(0, 12) + "...";
                                    }
                                }

                                request.state['data'].matches[i].lastmessageDatetime = listOfMessages[i].datetime;
                                var date = new Date(request.state['data'].matches[i].lastmessageDatetime);
                                request.state['data'].matches[i].lastmessageDatetime.lastmessageDatetime = date.toString();
                            }
                        }

                        request.state['data'].matches.sort(function (a, b) {
                            return new Date(b.lastmessageDatetime).getTime() - new Date(a.lastmessageDatetime).getTime();
                        });
                        //return reply('<pre>' + JSON.stringify(request.state['data'].matches, null, 4) + JSON.stringify(listOfMessages, null, 4) + '</pre>');

                        historys.find({profileId: doc._id}).select("-_id").sort('-datetime').
                                exec(function (err, history) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    if (history) {
                                        request.state['data'].randomizeHistory = history;
                                    }
                                    if (doc.randomizeFilters.filterInt) {
                                        request.state['data'].filterInt = true;
                                    }
                                    if (doc.randomizeFilters.filterAge) {
                                        request.state['data'].filterAge = true;
                                    }
                                    if (doc.randomizeFilters.filterLoc) {
                                        request.state['data'].filterLoc = true;
                                    }
                                    var roomId = '';
                                    var params = Common.getRoomParameters(request, roomId, null, null);
                                    params['ronid'] = request.state['data'].ronid;
                                    request.state['data'].params = params;
                                    request.state['data'].params.host = Config.server.host;
                                    request.state['data'].params.name = Config.server.name;
                                    request.state['data'].userstate = "active";
                                    return reply.view('rondevu_home', request.state['data']);
                                    return reply('<pre>' + JSON.stringify(request.state['data'], null, 4) + '</pre>');
                                });
                    });
                }
            });
        }
    }
};

exports.savesettings = {
    handler: function (request, reply) {
        //return reply('<pre>' + JSON.stringify(request.state['data'], null, 4) + '</pre>');
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            var settings = {settings: {preference: request.payload.preference,
                    distance: request.payload.distance,
                    age_range: {low: request.payload['age_range[low]'], high: request.payload['age_range[high]']},
                    location: {lat: request.payload['location[lat]'], lng: request.payload['location[lng]']}
                }};
            users.findOneAndUpdate({fbid: request.state['data'].credentials.profile.id}, settings, {new : true}, function (err, doc) {
                if (err) {
                    return reply("user not found");
                } else {
                    if (doc.banned === 1) {
                        return reply("unauth");
                    } else {
                        return reply("success");
                    }
                }
            });
        }
    }};
exports.savesettingsnew = {
    handler: function (request, reply) {
        //return reply('<pre>' + JSON.stringify(request.state['data'], null, 4) + '</pre>');
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            helpers.readTextFile('USZIP.csv', function (data) {
                helpers.parseCSV(data, function (data) {
                    var findValue = data.find(function (element) {
                        return element.indexOf(request.payload.zip) > -1;
                    });
                    if (!findValue) {
                        return reply("invZip");
                    } else {
                        var settings = {settings: {preference: request.payload.preference,
                                distance: request.payload.distance,
                                age_range: {low: request.payload['age_range[low]'], high: request.payload['age_range[high]']},
                                location: {lat: findValue[1], lng: findValue[2]}
                            }};
                        users.findOneAndUpdate({fbid: request.state['data'].credentials.profile.id}, settings, {new : true}, function (err, doc) {
                            if (err) {
                                return reply("user not found");
                            }
                            if (doc.banned === 1) {
                                return reply("unauth");
                            } else {
                                return reply("success");
                            }
                        });
                    }
                });
            });
        }
    }};
exports.loadsettings = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                fbid: request.state['data'].credentials.profile.id
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {
                    if (doc.banned === 1) {
                        return reply("unauth");
                    } else {
                        request.state['data'].userstate = "active";
                        request.state['data'].ronid = doc._id;
                        return reply(doc.settings);
                    }
                } else {
                    return reply("notfound");
                }
            });
        }
//http://graph.facebook.com/67563683055/picture?type=square
        // reply.view('rondevu_home', request.auth.credentials);
    }};
exports.loadmessages = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                fbid: request.state['data'].credentials.profile.id
            }, function (err, user) {
                if (err) {
                }
                if (user === null) {
                    return reply("notfound");
                } else {
                    if (user._id.toString() === request.payload.usersloginid) { //they are real
                        relations.findOne({
                            profileId: request.payload.profileId,
                            fbid1: request.state['data'].credentials.profile.id,
                            match: true
                        }, function (err, docr) {
                            if (err) {
                            }
                            if (docr !== null) { //they are matched
                                var query = {to: request.payload.usersloginid, from: request.payload.profileId};
                                messages.find(
                                        query
                                        )
                                        .sort('-date').
                                        exec(function (err, messagesto) {
                                            if (err) {
                                            }
                                            var query = {to: request.payload.profileId, from: request.payload.usersloginid};
                                            messages.find(
                                                    query
                                                    )
                                                    .sort('-date').
                                                    exec(function (err, messagesfrom) {
                                                        if (err) {
                                                        }
                                                        var messagearray = [];
                                                        for (var attrname in messagesto) {
                                                            messagearray.push(messagesto[attrname]);
                                                        }
                                                        for (var attrname in messagesfrom) {
                                                            messagearray.push(messagesfrom[attrname]);
                                                        }
                                                        var what = messagearray.sort(function (a, b) {
                                                            return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
                                                        });
                                                        users.findOne({
                                                            _id: request.payload.profileId
                                                        }, function (err, user2) {
                                                            if (err) {
                                                            }
                                                            if (user === null) {
                                                                return reply("notfound");
                                                            } else {
                                                                messageData = {messages: what, profilePic1: user.pictures.pic1, profilePic2: user2.pictures.pic1};
                                                                reply(messageData);
                                                            }
                                                        });
                                                    });
                                        });
                            }
                        });
                    }
                }
            });
        }
    }};
exports.loadfindmatches = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                fbid: request.state['data'].credentials.profile.id
            }, function (err, docp) {
                if (err) {
                }
                if (docp === null) {
                    return reply("notfound");
                } else {
                    var query = {fbid1: request.state['data'].credentials.profile.id};
                    relations.find(query).exec(function (err, docr) {
                        if (err) {
                        }
                        var nin = [query.fbid1];
                        if (docr !== null) {
                            for (var key in docr) {
                                if (docr.hasOwnProperty(key)) {
                                    nin.push(docr[key].fbid2);
                                }
                            }
                            query = {};
                            var now = new Date();
                            var lowYr = new Date();
                            var highYr = new Date();
                            lowYr.setYear(now.getYear() - docp.settings.age_range.high);
                            highYr.setYear(now.getYear() - docp.settings.age_range.low);
                            lowYr = new Date(lowYr.getFullYear() + '-01-01');
                            highYr = new Date(highYr.getFullYear() + '-12-31');
                            query['birthday'] = {$gt: lowYr, $lt: highYr};
                            switch (docp.settings.preference) {
                                case "males":
                                    query['gender'] = "male";
                                    break;
                                case "females":
                                    query['gender'] = "female";
                                    break;
                            }
                            query['fbid'] = {$nin: nin};
                            users.find(
                                    query
                                    ).
                                    limit(30).
                                    exec(function (err, docm) {
                                        if (err) {
                                        }
                                        if (Object.keys(docm).length === 0) {
                                            return reply("none");
                                        } else {
                                            var returndoc = {};
                                            var num = 0;
                                            for (var index = 0; index < docm.length; ++index) {
                                                var today = new Date();
                                                var birthDate = docm[index].birthday;
                                                var age = today.getFullYear() - birthDate.getFullYear();
                                                var m = today.getMonth() - birthDate.getMonth();
                                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                                    age--;
                                                }
                                                var radlat1 = Math.PI * docm[index].settings.location.lat / 180;
                                                var radlat2 = Math.PI * docp.settings.location.lat / 180;
                                                var theta = docm[index].settings.location.lng - docp.settings.location.lng;
                                                var radtheta = Math.PI * theta / 180;
                                                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                                                dist = Math.acos(dist);
                                                dist = dist * 180 / Math.PI;
                                                dist = dist * 60 * 1.1515;
                                                if (dist <= docp.settings.distance) {
                                                    dist = Math.round(dist);
                                                    if (dist < 10) {
                                                        dist = '< 10';
                                                    }
                                                    returndoc[num] = {_id: docm[index]._id, age: age, name: docm[index].name, fbid: docm[index].fbid, pictures: docm[index].pictures, about: docm[index].about, dist: dist};
                                                    num++;
                                                }
                                            }
                                            if (Object.keys(returndoc).length > 0) {
                                                return reply(returndoc);
                                            } else {
                                                return reply("none");
                                            }
                                        }
                                    });
                        }
                    });
                }
            });
        }
    }};
exports.sortmatches = {
    handler: function (request, reply) {
        console.log(request.payload);
        relations.findOne({
            fbid1: request.payload.fbid2,
            fbid2: request.state['data'].credentials.profile.id
        }, function (err, doc) {
            if (err) {
            }
            if (doc !== null) {
                if (doc.match === true) {
                    return reply("done");
                }

                console.log('1');
                if (doc.like === true && request.payload.like === 'true') {
                    users.findOne({
                        fbid: doc.fbid1
                    }, function (err, doc2) {
                        if (err) {
                        }
                        if (doc2 !== null) {
                            console.log('2');
                            relations.findByIdAndUpdate(doc._id, {match: true, profileId: mongoose.Types.ObjectId(request.state['data'].ronid), name: request.state['data'].credentials.profile.raw.first_name}, function (err, raw) {
                                if (err) {
                                }
                                var relation = new relations();
                                relation.fbid1 = request.state['data'].credentials.profile.id;
                                relation.fbid2 = doc2.fbid;
                                relation.like = request.payload.like;
                                relation.match = true;
                                relation.profileId = mongoose.Types.ObjectId(doc2._id);
                                relation.name = doc2.name;
                                relation.save(function (err, relation) {
                                    if (err) {
                                        return err;
                                    }
                                    console.log("rondevu470: " + doc2.pictures.isNull1 + " " + doc2.status);
                                    return reply({match: true, matchdata: relation, isNull1: doc2.pictures.isNull1, online: doc2.status});
                                });
                            });
                        }
                    });
                } else {
                    //no match other didnt like
                    var relation = new relations();
                    relation.fbid1 = request.state['data'].credentials.profile.id;
                    relation.fbid2 = request.payload.fbid2;
                    relation.like = request.payload.like;
                    relation.match = false;
                    relation.save(function (err, relation) {
                        if (err) {
                            return err;
                        }
                        return reply("done " + request.payload.fbid2);
                    });
                }
            } else {
                //other user has not said anything no match
                var relation = new relations();
                relation.fbid1 = request.state['data'].credentials.profile.id;
                relation.fbid2 = request.payload.fbid2;
                relation.like = request.payload.like;
                relation.match = false;
                relation.save(function (err, relation) {
                    if (err) {
                        return err;
                    }
                    return reply("done " + request.payload.fbid2);
                });
            }
        }
        );
    }};
exports.sortmatchesranreq = {
    handler: function (request, reply) {
        historys.findOne({$or: [{profileId: request.payload.userId}, {userId: request.payload.userId}]}).
                exec(function (err, history) {
                    if (err) {
                        console.log(err);
                    }
                    if (history) {
                        users.findOne({
                            _id: request.payload.userId
                        }, function (err, docreq1) {
                            if (err) {
                            }
                            if (docreq1 !== null) {
                                relations.findOne({
                                    fbid1: docreq1.fbid,
                                    fbid2: request.state['data'].credentials.profile.id
                                }, function (err, doc) {
                                    if (err) {
                                    }
                                    if (doc !== null) {
                                        if (doc.match === true) {
                                            return reply("done");
                                        }
                                        if (doc.like === true && request.payload.like === 'true') {
                                            users.findOne({
                                                fbid: doc.fbid1
                                            }, function (err, doc2) {
                                                if (err) {
                                                }
                                                if (doc2 !== null) {
                                                    relations.findByIdAndUpdate(doc._id, {match: true, profileId: mongoose.Types.ObjectId(request.state['data'].ronid), name: request.state['data'].credentials.profile.raw.first_name}, function (err, raw) {
                                                        if (err) {
                                                            console.log(err);
                                                        }
                                                        relations.findOne({
                                                            fbid1: request.state['data'].credentials.profile.id,
                                                            fbid2: docreq1.fbid
                                                        }, function (err, docCheck) {
                                                            if (err) {
                                                            }
                                                            historys.remove({$or: [{profileId: request.payload.userId}, {userId: request.payload.userId}]}).
                                                                    exec(function (err) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                        }
                                                                        if (docCheck !== null) {
                                                                            relations.findByIdAndUpdate(doc._id, {match: true, profileId: request.payload.userId}, function (err, raw) {
                                                                                if (err) {
                                                                                    console.log(err);
                                                                                }
                                                                                return reply({match: true, matchdata: relation, isNull1: doc2.pictures.isNull1, online: doc2.status});
                                                                            });
                                                                        } else {
                                                                            var relation = new relations();
                                                                            relation.fbid1 = request.state['data'].credentials.profile.id;
                                                                            relation.fbid2 = doc2.fbid;
                                                                            relation.like = request.payload.like;
                                                                            relation.match = true;
                                                                            relation.profileId = mongoose.Types.ObjectId(doc2._id);
                                                                            relation.name = doc2.name;
                                                                            relation.save(function (err, relation) {
                                                                                if (err) {
                                                                                    return err;
                                                                                }
                                                                                console.log("rondevu470: " + doc2.pictures.isNull1 + " " + doc2.status);
                                                                                return reply({match: true, matchdata: relation, isNull1: doc2.pictures.isNull1, online: doc2.status});
                                                                            });
                                                                        }
                                                                    });
                                                        });
                                                    });
                                                }
                                            });
                                        } else {
                                            relations.findOne({
                                                fbid1: request.state['data'].credentials.profile.id,
                                                fbid2: docreq1.fbid
                                            }, function (err, docCheck) {
                                                if (docCheck === null) {
                                                    //no match other didnt like
                                                    var relation = new relations();
                                                    relation.fbid1 = request.state['data'].credentials.profile.id;
                                                    relation.fbid2 = docreq1.fbid;
                                                    relation.like = request.payload.like;
                                                    relation.match = false;
                                                    relation.save(function (err, relation) {
                                                        if (err) {
                                                            return err;
                                                        }
                                                        return reply("done " + docreq1.fbid);
                                                    });
                                                }
                                            });
                                        }
                                    } else {
                                        relations.findOne({
                                            fbid1: request.state['data'].credentials.profile.id,
                                            fbid2: docreq1.fbid
                                        }, function (err, docCheck) {
                                            if (docCheck === null) {
                                                //other user has not said anything, no match
                                                var relation = new relations();
                                                relation.fbid1 = request.state['data'].credentials.profile.id;
                                                relation.fbid2 = docreq1.fbid;
                                                relation.like = request.payload.like;
                                                relation.match = false;
                                                relation.save(function (err, relation) {
                                                    if (err) {
                                                        return err;
                                                    }
                                                    return reply("done " + docreq1.fbid);
                                                });
                                            }
                                        });
                                    }
                                }
                                );
                            }
                        });
                    }
                });
    }};
exports.loadprofileedit = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                fbid: request.state['data'].credentials.profile.id
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {
                    var returndoc = {id: doc._id, pictures: doc.pictures, education: doc.education, about: doc.about};
                    return reply(returndoc);
                } else {

                    return reply("notfound");
                }
            });
            //return reply(request.payload);
        }
//http://graph.facebook.com/67563683055/picture?type=square
        // reply.view('rondevu_home', request.auth.credentials);
    }};
exports.saveprofile = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {//pictures:request.payload.pictures
            var total = parseInt(request.payload['pic1[]'][0]) + parseInt(request.payload['pic2[]'][0]) +
                    parseInt(request.payload['pic3[]'][0]) + parseInt(request.payload['pic4[]'][0]) +
                    parseInt(request.payload['pic5[]'][0]) + parseInt(request.payload['pic6[]'][0]);
            pictures = {};
            //console.log(total);
            if (total === 21) {
                pictures = {
                    pic1: request.payload['pic1[]'][1],
                    isNull1: request.payload['pic1[]'][2],
                    pic2: request.payload['pic2[]'][1],
                    isNull2: request.payload['pic2[]'][2],
                    pic3: request.payload['pic3[]'][1],
                    isNull3: request.payload['pic3[]'][2],
                    pic4: request.payload['pic4[]'][1],
                    isNull4: request.payload['pic4[]'][2],
                    pic5: request.payload['pic5[]'][1],
                    isNull5: request.payload['pic5[]'][2],
                    pic6: request.payload['pic6[]'][1],
                    isNull6: request.payload['pic6[]'][2]
                };
                var info = {about: request.payload.about, pictures: pictures};
                //console.log(info);
                users.findOneAndUpdate({fbid: request.state['data'].credentials.profile.id}, info, {new : true}, function (err, doc) {
                    if (err) {
                        return reply("failed");
                    }
                    if (doc) {
                        return reply("success");
                    }
                });
            } else {
                return reply("failed");
            }
        }
    }};
exports.deleteaccount = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            helpers.deleteUserPictureFolder(request.state['data'].ronid, function () {
                users.remove({_id: request.state['data'].ronid}, function (err) {
                    if (err) {
                        return reply('error');
                    } else {
                        relations.remove({$or: [{fbid1: request.state['data'].credentials.profile.id}, {fbid2: request.state['data'].credentials.profile.id}]}, function (err) {
                            if (err) {
                                return reply('error');
                            } else {
                                historys.remove({$or: [{profileId: mongoose.Types.ObjectId(request.state['data'].ronid)}, {userId: mongoose.Types.ObjectId(request.state['data'].ronid)}]}, function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        return reply('success');
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    }};
exports.getspecificprofile = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {

            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {

                    users.findOne({
                        _id: request.payload.profileId
                    }, function (err, doc2) {
                        if (err) {
                        }
                        if (doc2 !== null) {
                            var today = new Date();
                            var birthDate = doc2.birthday;
                            var age = today.getFullYear() - birthDate.getFullYear();
                            var m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                            }
                            var radlat1 = Math.PI * doc2.settings.location.lat / 180;
                            var radlat2 = Math.PI * doc.settings.location.lat / 180;
                            var theta = doc2.settings.location.lng - doc.settings.location.lng;
                            var radtheta = Math.PI * theta / 180;
                            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                            dist = Math.acos(dist);
                            dist = dist * 180 / Math.PI;
                            dist = dist * 60 * 1.1515;
                            dist = Math.round(dist);
                            if (dist < 10) {
                                dist = '< 10';
                            }
                            var rtnobj = {pictures: doc2.pictures, education: doc2.education, about: doc2.about, name: doc2.name, age: age, dist: dist};
                            return reply(rtnobj);
                        }
                    });
                }
            });
        }
    }};
exports.removepic = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {
                    if (request.payload.picorder !== null && request.payload.piccontent !== null) {
                        helpers.deleteSingleFile("public/images/" + doc._id + "/" + request.payload.piccontent + ".jpg", function (data) {
                            var pictures = doc.pictures;
                            pictures['isNull' + request.payload.picorder] = false;
                            //console.log(pictures);
                            updatepicturesDB(doc, pictures);
                            return reply(data);
                        });
                    }
                }
            });
        }
    }
};
exports.getfbpics = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {
                    GetUrlofEveryFBImage(doc, request, function (callback) {
                        return reply(callback);
                    });
                }
            });
        }
    }
};
exports.savenewfbpic = {
    handler: function (request, reply) {

        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                }
                if (doc !== null) {
                    if (request.payload.content === 'null') {
                        console.log("content=null");
                        request.payload.content = request.payload.order;
                    }
                    if (doc.pictures.fbPicMeta) {
                        var partsOfStr = doc.pictures.fbPicMeta.split(',');
                        var index = partsOfStr.indexOf(request.payload.picid);
                        helpers.getImg(partsOfStr[index + 1], 'public/images/' + doc._id, request.payload.content + ".jpg", function () {
                            doc.pictures.fbPicMeta = "";
                            doc.pictures["pic" + request.payload.order] = request.payload.content;
                            doc.pictures["isNull" + request.payload.order] = true;
                            updatepicturesDB(doc, doc.pictures);
                            return reply("success");
                        });
                    }
                }
            });
        }
    }
};
exports.reportuser = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                if (doc === null) {
                    return reply("failed");
                } else {
                    relations.findOne({
                        profileId: request.payload.id,
                        match: true,
                        fbid1: doc.fbid
                    }, function (err, docr) {
                        if (err) {
                            console.log(err);
                        }
                        if (docr === null) {
                            return reply("failed");
                        } else {
                            if (request.payload.category < 0 && request.payload.category > 5) {
                                return reply("failed");
                            } else {
                                //console.log(request.payload);

                                if (request.payload.disc.length > 449) {
                                    request.payload.disc = request.payload.disc.substr(0, 450);
                                }
                                var report = new reports();
                                report.profileIdReporter = mongoose.Types.ObjectId(request.state['data'].ronid);
                                report.profileIdReported = mongoose.Types.ObjectId(request.payload.id);
                                report.category = request.payload.category;
                                report.disc = request.payload.disc;
                                if (request.payload.morr !== 'match' || request.payload.morr !== 'random') {
                                    request.payload.morr = '???';
                                }
                                report.matchedOrRandom = request.payload.morr; //m or r (matched or random)
                                report.save(function (err) {
                                    if (err) {
                                        return err;
                                    }
                                    return reply("success");
                                });
                            }
                        }
                    });
                }
            });
        }
    }
};
exports.unmatchuser = {
    handler: function (request, reply) {

        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                if (doc === null) {
                    return reply("failed");
                } else {
                    //console.log(doc);
                    relations.findOneAndUpdate({
                        profileId: mongoose.Types.ObjectId(request.state['data'].ronid),
                        match: true,
                        fbid2: doc.fbid
                    }, {unmatched: true}, {new : true}, function (err, doc1) {
                        if (err) {
                            console.log(err);
                        }
                        if (doc1 === null) {
                            return reply("failed");
                        } else {
                            // console.log(doc1);
                            relations.findOneAndUpdate({
                                profileId: request.payload.id,
                                match: true,
                                fbid1: doc.fbid
                            }, {unmatched: true}, {new : true}, function (err, doc2) {
                                if (err) {
                                    console.log(err);
                                }
                                if (doc2 === null) {
                                    return reply("failed");
                                } else {
                                    return reply("success");
                                }
                            });
                        }
                    });
                }
            });
        }
    }
};
exports.updateranfilter = {
    handler: function (request, reply) {

        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                if (doc === null) {
                    return reply("failed");
                } else {

                    //console.log(request.payload.save1 + " " + request.payload.save2 + " " + request.payload.save3);
                    if (request.payload.save1 === 'true' || request.payload.save1 === 'false') {
                        if (request.payload.save2 === 'true' || request.payload.save2 === 'false') {
                            if (request.payload.save3 === 'true' || request.payload.save3 === 'false') {

                                users.findOneAndUpdate({fbid: doc.fbid}, {randomizeFilters: {filterInt: request.payload.save1, filterAge: request.payload.save2, filterLoc: request.payload.save3}}, {new : true}, function (err, doc2) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(doc2);
                                        return reply("success");
                                    }
                                });
                            }
                        }
                    }

                }
            });
        }
    }};
exports.refreshrandomizehistory = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                if (doc === null) {
                    return reply("failed");
                } else {
                    historys.find({profileId: doc._id}).select("-_id").sort('-datetime').
                            exec(function (err, history) {
                                if (err) {
                                    console.log(err);
                                }
                                if (history) {
                                    return reply(history);
                                }
                            });
                }
            });
        }
    }};

exports.postimage = {
    handler: function (request, reply) {
        if (request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            users.findOne({
                _id: request.state['data'].ronid
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                if (doc === null) {
                    return reply("failed");
                } else {

                    if (request.info.hostname === Config.server.domain) {
                        //console.log("1073");
                        //console.log(JSON.stringify(request.payload.image));
                        var base64Data = request.payload.image.replace(/^data:image\/jpeg;base64,/, "");

                        require("fs").writeFile('public/images/' + doc._id + '/' + request.payload.place + '.jpg', base64Data, 'base64', function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                var pictures = doc.pictures;
                                pictures["pic" + request.payload.order] = request.payload.place;
                                pictures["isNull" + request.payload.order] = true;
                                updatepicturesDB(doc, pictures);
                                return reply(true);
                            }
                        });
                    }
                }
            });
        }
    }};

function GetUrlofEveryFBImage(user, request, callback) {
    if (typeof (request.state['data'].credentials.profile.raw.albums) === 'undefined') {
        return null;
    }
    graph.setAccessToken(request.state['data'].credentials.token);
    var albumdata = request.state['data'].credentials.profile.raw.albums.data;
    var album = [];
    var photos = "";
    var index = 0;
    var params = {fields: "photos.fields(source)"};
    var params2 = {fields: "images, source"};
    for (var i = 0; i < albumdata.length; i++) {
        album.push(albumdata[i].id);
        if (i === albumdata.length - 1) {
            for (var j = 0; j < album.length; j++) {
                graph.get(album[j], params, function (err, res) {
                    for (var k = 0; k < res.photos.data.length; k++) {
                        photos += res.photos.data[k].id + ',' + res.photos.data[k].source + ',';
                    }
                });
            }
        }
    }
    setTimeout(function () {
        user.pictures.fbPicMeta = photos;
        var pictures = user.pictures;
        picturesHolder = {pictures};
        users.findOneAndUpdate({fbid: user.fbid}, picturesHolder, {new : true}, function (err, doc) {
            if (err) {
            } else {
                callback(pictures.fbPicMeta);
            }
        });
    }, 650);
}
function GetalltheFBprofileImages(user, request) {
    var pictures = {};
    if (typeof (request.auth.credentials.profile.raw.albums) === 'undefined') {
        helpers.getImg('https://graph.facebook.com/' + user.fbid + '/picture?width=200&height=200',
                'public/images/' + user.id, "1.jpg", function () {
                    pictures.pic1 = 1;
                    pictures.isNull1 = 1;
                    updatepicturesDB(user, pictures)
                });
        return;
    }
    var albumdata = request.auth.credentials.profile.raw.albums.data;
    var album = "";
    for (var i = 0; i < albumdata.length; i++) {
        if (albumdata[i].type === 'profile') {
            album = albumdata[i].id;
        }
    }
    graph.setAccessToken(request.auth.credentials.token);
    var params = {fields: "photos"};
    //157538147595116/?fields=photos get all photos in the album
    //223154477700149/?fields=images get the links from those photos
    if (album.length > 0) {
        graph.get(album, params, function (err, res) {
            var params = {fields: "images"};
            var imagescount = 0;
            if (res.photos.data[0]) {
                graph.get(res.photos.data[0].id, params, function (err, res2) {
                    helpers.getImg(res2.images[0].source,
                            'public/images/' + user._id, "1.jpg", function () {
                                imagescount++;
                                pictures.pic1 = imagescount;
                                pictures.isNull1 = 1;
                                if (res.photos.data[1]) {
                                    graph.get(res.photos.data[1].id, params, function (err, res2) {
                                        helpers.getImg(res2.images[0].source,
                                                'public/images/' + user._id, "2.jpg", function () {
                                                    imagescount++;
                                                    pictures.pic2 = imagescount;
                                                    pictures.isNull2 = 1;
                                                    if (res.photos.data[2]) {
                                                        graph.get(res.photos.data[2].id, params, function (err, res2) {
                                                            helpers.getImg(res2.images[0].source,
                                                                    'public/images/' + user._id, "3.jpg", function () {
                                                                        imagescount++;
                                                                        pictures.pic3 = imagescount;
                                                                        pictures.isNull3 = 1;
                                                                        if (res.photos.data[3]) {
                                                                            graph.get(res.photos.data[3].id, params, function (err, res2) {
                                                                                helpers.getImg(res2.images[0].source,
                                                                                        'public/images/' + user._id, "4.jpg", function () {
                                                                                            imagescount++;
                                                                                            pictures.pic4 = imagescount;
                                                                                            pictures.isNull4 = 1;
                                                                                            if (res.photos.data[4]) {
                                                                                                graph.get(res.photos.data[4].id, params, function (err, res2) {
                                                                                                    helpers.getImg(res2.images[0].source,
                                                                                                            'public/images/' + user._id, "5.jpg", function () {
                                                                                                                imagescount++;
                                                                                                                pictures.pic5 = imagescount;
                                                                                                                pictures.isNull5 = 1;
                                                                                                                if (res.photos.data[5]) {
                                                                                                                    graph.get(res.photos.data[5].id, params, function (err, res2) {
                                                                                                                        helpers.getImg(res2.images[0].source,
                                                                                                                                'public/images/' + user._id, "6.jpg", function () {
                                                                                                                                    imagescount++;
                                                                                                                                    pictures.pic6 = imagescount;
                                                                                                                                    pictures.isNull6 = 1;
                                                                                                                                    updatepicturesDB(user, pictures);
                                                                                                                                });
                                                                                                                    });
                                                                                                                } else {
                                                                                                                    updatepicturesDB(user, pictures);
                                                                                                                }
                                                                                                            });
                                                                                                });
                                                                                            } else {
                                                                                                updatepicturesDB(user, pictures);
                                                                                            }
                                                                                        });
                                                                            });
                                                                        } else {
                                                                            updatepicturesDB(user, pictures);
                                                                        }
                                                                    });
                                                        });
                                                    } else {
                                                        updatepicturesDB(user, pictures);
                                                    }
                                                });
                                    });
                                } else {
                                    updatepicturesDB(user, pictures);
                                }
                            });
                });
            }
        });
    }
}
function updatepicturesDB(user, pictures) {
    pictures = {pictures};
    users.findOneAndUpdate({fbid: user.fbid}, pictures, {new : true}, function (err, doc) {
        if (err) {
        } else {
        }
    });
}




