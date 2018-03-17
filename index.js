const restify = require('restify');

const server = restify.createServer();
server.get(/\/.*/, restify.plugins.serveStatic({
    directory: './dist',
    default: 'index.html'
}));

server.listen(12345, () => {
    console.log('%s listening at %s', server.name, server.url);
});