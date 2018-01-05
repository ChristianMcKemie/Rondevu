var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    to: { type: mongoose.Schema.ObjectId, required: true},
    from: { type: mongoose.Schema.ObjectId, required: true},
    message: {
        type: String,
        max: 5000
    },
    datetime: {type: Date, default: Date.now},
    name: String

});

module.exports = mongoose.model('Message', MessageSchema);