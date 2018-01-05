var users = require('../models/users');
var relations = require('../models/relations');
var messages = require('../models/messages');

exports.connectionOnline = function (ronid, socketId, callback) {

    users.findOneAndUpdate({_id: ronid}, {socketId: socketId}, {new : true}, function (err, doc) {
        if (err) {
            callback(err);
        }
        if (doc !== null) {
            if (doc.status !== "1") { //1 for online 0 for offline
                users.findOneAndUpdate({_id: ronid}, {status: 1}, {new : true}, function (err, doc2) {
                    if (err) {
                        callback("err");
                    }
                    if (doc2 !== null) {
                        relations.find({fbid1: doc2.fbid, match: true}).then(function (Relation) {
                            var jobQueries = [];
                            Relation.forEach(function (u) {
                                jobQueries.push(users.find({_id: u.profileId, status: 1}).select('_id'));
                            });
                            return Promise.all(jobQueries);
                        }).then(function (listOfMatches) {
                            onlineMatches = [];
                            for (var i = 0; i < listOfMatches.length; i++) {
                                onlineMatches.push(listOfMatches[i][0]);
                            }
                            callback(onlineMatches);
                        }).catch(function (err) {
                        });
                    }
                });
            }
        }
    });
};


exports.connectionOffline = function (socketId, callback) {

    users.findOneAndUpdate({socketId: socketId}, {socketId: socketId}, {new : true}, function (err, doc) {
        if (err) {
            callback(err);
        }
        if (doc !== null) {
            if (doc.status !== "") { //1 for online 0 for offline
                users.findOneAndUpdate({_id: doc._id}, {status: "", socketId: ""}, {new : true}, function (err, doc2) {
                    if (err) {
                        callback("err");
                    }
                    if (doc2 !== null) {
                        relations.find({fbid1: doc2.fbid, match: true}).then(function (Relation) {
                            var jobQueries = [];
                            Relation.forEach(function (u) {
                                jobQueries.push(users.find({_id: u.profileId, status: 1}).select('_id'));
                            });
                            return Promise.all(jobQueries);
                        }).then(function (listOfMatches) {
                            onlineMatches = [];
                            for (var i = 0; i < listOfMatches.length; i++) {
                                onlineMatches.push(listOfMatches[i][0]);
                            }
                            callback(onlineMatches, doc2._id);
                        }).catch(function (err) {
                            callback("err");
                        });
                    }
                });
            }
        }
    });
};
