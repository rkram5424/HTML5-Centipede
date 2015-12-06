var fs = require('fs');
var restify = require('restify');
var server = restify.createServer();

server.get(/.*/, restify.serveStatic({
  directory: __dirname,
  default: 'index.html'
}));

server.get('/', function(req, res, done){
  fs.readFile('index.html', 'utf8', function(err, html){
    if(err) throw err;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
    return done();
  });
});

server.listen(8080, function(){
  console.log('Listening at ' + server.url);
});
