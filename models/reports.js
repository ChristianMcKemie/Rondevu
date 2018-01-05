// app/models/relations.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReportsSchema = new Schema({
    profileIdReporter: { type: mongoose.Schema.ObjectId, required: true},
    profileIdReported: { type: mongoose.Schema.ObjectId, required: true},
    category: String,
    disc: String,
    matchedOrRandom: String,
    reportedDateTime: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Reports', ReportsSchema);