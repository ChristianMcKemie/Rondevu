var Index = require('../controller');
var Room = require('../controller/room');
var Rondevu = require('../controller/rondevu');
var Randomize = require('../controller/randomize');
var admin = require('../controller/admincontroller');

exports.endpoints = [
    {method: 'GET', path: '/', config: Rondevu.login},
    {
        method: 'GET',
        path: '/facebook',
        config: Rondevu.facebookauth
    },
    {method: 'GET', path: '/admin', config: admin.admin},
    {method: 'POST', path: '/getreports', config: admin.getreports},
    {method: 'POST', path: '/ban', config: admin.ban},

    {method: 'GET', path: '/new', config: Rondevu.new},
    {method: 'GET', path: '/home', config: Rondevu.home},
    {method: 'GET', path: '/logout', config: Rondevu.logout},
    {method: 'GET', path: '/privacy', config: Rondevu.privacy},
    {method: 'POST', path: '/savesettings', config: Rondevu.savesettings},
    {method: 'POST', path: '/savesettingsnew', config: Rondevu.savesettingsnew},
    {method: 'POST', path: '/removepic', config: Rondevu.removepic},
    {method: 'POST', path: '/getfbpics', config: Rondevu.getfbpics},
    {method: 'POST', path: '/savenewfbpic', config: Rondevu.savenewfbpic},
    {method: 'POST', path: '/loadsettings', config: Rondevu.loadsettings},
    {method: 'POST', path: '/loadprofileedit', config: Rondevu.loadprofileedit},
    {method: 'POST', path: '/getspecificprofile', config: Rondevu.getspecificprofile},
    {method: 'POST', path: '/deleteaccount', config: Rondevu.deleteaccount},
    {method: 'POST', path: '/saveprofile', config: Rondevu.saveprofile},
    {method: 'POST', path: '/loadmessages', config: Rondevu.loadmessages},
    {method: 'POST', path: '/sortmatches', config: Rondevu.sortmatches},
    {method: 'POST', path: '/loadfindmatches', config: Rondevu.loadfindmatches},
    {method: 'POST', path: '/reportuser', config: Rondevu.reportuser},
    {method: 'POST', path: '/unmatchuser', config: Rondevu.unmatchuser},
    {method: 'POST', path: '/updateranfilter', config: Rondevu.updateranfilter},
    {method: 'POST', path: '/refreshrandomizehistory', config: Rondevu.refreshrandomizehistory},
    {method: 'POST', path: '/sortmatchesranreq', config: Rondevu.sortmatchesranreq},
    
    {method: 'POST', path: '/postimage', config: Rondevu.postimage},

    {method: 'GET', path: '/randomize', config: Randomize.main},

    {method: 'POST', path: '/join/{roomId}', config: Room.join},
    {method: 'POST', path: '/message/{roomId}/{clientId}', config: Room.message},
    {method: 'GET', path: '/{roomId}', config: Room.main},
    {method: 'POST', path: '/leave/{roomId}/{clientId}', config: Room.leave},
    {method: 'GET', path: '/turn', config: Index.turn},
    {method: 'GET', path: '/{param*}', handler: {
            directory: {
                path: 'public',
                listing: false
            }
        }
    }
];
