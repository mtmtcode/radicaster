'use strict';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    if (request.uri.endsWith("/")) {
        request.uri = request.uri + "index.rss";
    }

    if (!headers.authorization) {
        console.log('Authorization header not found.')
        callback(null, {
            status: '401',
            statusDescription: 'Unauthorized',
            headers: {
                'www-authenticate': [{ key: 'WWW-Authenticate', value: 'Basic' }]
            }
        });
        return;
    }

    const authUser = '__BASIC_AUTH_USER__';
    const authPassword = '__BASIC_AUTH_PASSWORD__';
    const authString = `Basic ${new Buffer.from(authUser + ':' + authPassword).toString('base64')}`;

    if (headers.authorization[0].value === authString) {
        console.log('Authorization succeeded.');
        callback(null, request);
        return;
    }

    console.log('Authorization failed.');
    return callback(null, {
        status: '403',
        statusDescription: 'Forbidden',
    });
};
