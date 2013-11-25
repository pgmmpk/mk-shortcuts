var express = require('express'),
	jade    = require('jade'),
	app     = express();

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use('/src', express.static(__dirname + '/../src'));
app.use('/dist', express.static(__dirname + '/../dist'));
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function(req, res) {
	res.render('index');
});

app.listen(3000);
