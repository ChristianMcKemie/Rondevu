var users = require('../models/users');
var relations = require('../models/relations');
var messages = require('../models/messages');
var reports = require('../models/reports');
var helpers = require('../helpers/helpers');
var graph = require('fbgraph');
var Common = require('./common');

exports.admin = {handler: function (request, reply) {
        if (!request.state['data'] || request.state['data'].isAuthenticated !== true) {
            return reply().redirect('/logout');
        } else {
            if (request.state['data'].credentials.profile.id !== "1770894709592777") {
                return reply().redirect('/home');
            } else {
                return reply.view('rondevu_admin', request.state['data']);
            }
        }
    }};




exports.getreports = {handler: function (request, reply) {

        if (!request.state['data'] || request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            if (request.state['data'].credentials.profile.id !== "1770894709592777") {
                return reply("unauth");
            } else {
                reports.find({})
                        .sort('date').
                        exec(function (err, reports) {
                            if (err) {
                                console.log(err);
                            } else {
                                var reportedObj = {};
                                var lastId;
                                var j = 0;
                                var x = 0;
                                for (var i in reports) {
                                    if (i === '0') {
                                        reportedObj[x] = {};
                                        reportedObj[x][j] = reports[i];
                                        lastId = reports[i].profileIdReported;
                                        console.log(lastId);
                                    } else {
                                        if (lastId === reports[i].profileIdReported) {
                                            j++;
                                            reportedObj[x][j] = reports[i];
                                        } else {
                                            lastId = reports[i].profileIdReported;
                                            j = 0;
                                            x++;
                                            reportedObj[x] = {};
                                            reportedObj[x][j] = reports[i];
                                        }
                                    }
                                }
                                console.log(reportedObj);
                                return reply(reportedObj);
                            }
                        });
            }
        }
    }};


exports.ban = {handler: function (request, reply) {
        if (!request.state['data'] || request.state['data'].isAuthenticated !== true) {
            return reply("unauth");
        } else {
            if (request.state['data'].credentials.profile.id !== "1770894709592777") {
                return reply("unauth");
            } else {

                users.findOneAndUpdate({_id: request.payload.id}, {banned: 1}, {new : true}, function (err, doc) {
                    if (err) {
                    } else {
                        return reply("success");
                    }
                });




            }
        }
    }};