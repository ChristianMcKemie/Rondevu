const Hapi = require('hapi')
        , CookieAuth = require('hapi-auth-cookie')
        , fs = require('file-system')
        , Hoek = require('hoek')
        , Bell = require('bell')
        , Vision = require('vision')
        , Inert = require('inert')
        , Route = require('./route')
        , Config = require('./config')
        , Socket = require('./socket')
        , Mongoose = require('mongoose');

var server = new Hapi.Server();
Mongoose.Promise = require('bluebird');
Mongoose.connect('mongodb://127.0.0.1:27017/Rondevu', {useMongoClient: true});
var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
    console.log('Connection with database succeeded.');
});

var app = {};
app.config = Config;
var tls = {
    key: fs.readFileSync('/etc/letsencrypt/live/'+app.config.server.domain+'/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/'+app.config.server.domain+'/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/'+app.config.server.domain+'/chain.pem')
};

server.connection({routes: {cors: true}, port: app.config.server.port, tls: tls});
server.register([
    Bell,
    CookieAuth,
    Vision,
    Inert,
    Socket
], function (err) {
    if (err) {
        throw err;
    }

    server.state('data', {
        ttl: null,
        isSecure: true,
        isHttpOnly: true,
        encoding: 'base64json',
        clearInvalid: false, // remove invalid cookies
        strictHeader: true, // don't allow violations of RFC 6265
        isSameSite: 'Lax'
    });
    server.auth.strategy(
            'session',
            'cookie',
            {
                cookie: 'example',
                password: 'secret',
                isSecure: true, // For development only
                redirectTo: '/login',
                redirectOnTry: true,
                appendNext: 'redirect',
            });


    server.auth.strategy('facebook', 'bell', {
        provider: 'facebook',
        password: 'cookie_encryption_password_secure',
        isSecure: true,
        clientId: app.config.facebook.clientId,
        clientSecret: app.config.facebook.clientSecret,
        location: app.config.server.host,
        scope: ['user_birthday', 'user_education_history', 'user_photos']
        , profileParams: {fields: 'birthday,gender,first_name,education,picture,albums{type{profile}}'}
    });
    server.route(Route.endpoints);
    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: './view'
    });






    server.start(function () {
        console.log('Server started at ' + app.config.server.host + '.');
    });
});