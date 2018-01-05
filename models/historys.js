// app/models/relations.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HistorySchema = new Schema({
    profileId: String,
    userId: String,
    name: String,
    pic1: Number,
    like: Boolean,
    datetime: {type: Date, default: Date.now}
});

module.exports = mongoose.model('History', HistorySchema);