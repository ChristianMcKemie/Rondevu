// app/models/relations.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationSchema = new Schema({
    profileId: { type: mongoose.Schema.ObjectId},
    fbid1: String,
    fbid2: String,
    like: Boolean,
    match: Boolean,
    name: String,
    unmatched: {type: Boolean, default: 0}
});

module.exports = mongoose.model('Relation', RelationSchema);