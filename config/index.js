module.exports = {
    constant: {
        LOOPBACK_CLIENT_ID: 'LOOPBACK_CLIENT_ID',
        TURN_BASE_URL: "https://www.therondevu.com",
        TURN_URL_TEMPLATE: '%s/turn',
        WSS_HOST_PORT_PAIRS: ["www.therondevu.com:8089"],
        RESPONSE_UNKNOWN_ROOM: 'UNKNOWN_ROOM',
        RESPONSE_UNKNOWN_CLIENT: 'UNKNOWN_CLIENT',
        RESPONSE_ROOM_FULL: 'FULL',
        RESPONSE_DUPLICATE_CLIENT: 'DUPLICATE_CLIENT'
    },
    server: {
        name: 'Rondevu',
        domain: 'www.therondevu.com',
        host: 'https://www.therondevu.com',
        port: process.env.PORT || 8080
    },
    facebook: {
        clientId: '1492962954100052',
        clientSecret: 'c663cffd962285530739686cf03f16bf'
    }
};
