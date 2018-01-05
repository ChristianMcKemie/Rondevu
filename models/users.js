// /models/users.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    fbid: String,
    name: String,
    birthday: {type: Date},
    about: {type: String, max: 4000, default: ""},
    gender: String,
    education: String,
    socketId: String,
    status: Boolean,
    lastmessage: String,
    lastmessageDatetime: {type: Date, default: Date.now},
    settings:
            {
                preference: String,
                age_range:
                        {
                            low: Number,
                            high: Number
                        },
                distance: Number,
                location:
                        {
                            lat: Number,
                            lng: Number
                        }},
    pictures: {
        pic1: {type: Number, default: 1},
        isNull1: {type: Boolean, default: false},
        pic2: {type: Number, default: 2},
        isNull2: {type: Boolean, default: false},
        pic3: {type: Number, default: 3},
        isNull3: {type: Boolean, default: false},
        pic4: {type: Number, default: 4},
        isNull4: {type: Boolean, default: false},
        pic5: {type: Number, default: 5},
        isNull5: {type: Boolean, default: false},
        pic6: {type: Number, default: 6},
        isNull6: {type: Boolean, default: false},
        fbPicMeta: {type: String, default: null}
    },
    randomize: {
        auth: {type: Number, default: null},
        que: {type: Number, default: null},
        status: {type: String, default: null},
    },
    randomizeFilters: {
        filterInt: {type: Boolean, default: true},
        filterAge: {type: Boolean, default: false},
        filterLoc: {type: Boolean, default: false}
    },
    banned: {type: Boolean, default: 0},
    joined: {type: Date, default: Date.now}
});
module.exports = mongoose.model('User', UserSchema);