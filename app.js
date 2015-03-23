var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-locals');
var nedb = require('nedb');
var moment = require('moment');
var ejs = require('ejs');
var marked = require('marked');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var handlebars = require('express-handlebars');
var configurator = require('configurator');
var index_configurator = require('configurator').get_config();
var multer = require('multer');
var node_pagination = require('pagination');
var string = require('string');
var fs = require('fs');

// load the db
var db = new nedb();
db = {};
db.posts = new nedb({ filename: 'data/posts.db', autoload: true });
db.users = new nedb({ filename: 'data/users.db', autoload: true });
db.media = new nedb({ filename: 'data/media.db', autoload: true });
db.navigation = new nedb({ filename: 'data/navigation.db', autoload: true });

// markdown stuff
marked.setOptions({
  renderer: new marked.Renderer()
});

// require the routes
var routes = require('./routes/index');
var page = require('./routes/page');
var admin = require('./routes/admin');
var tag = require('./routes/tag');

var app = express();

// view engine setup
app.engine('hbs', handlebars({extname:'hbs', defaultLayout:'layout.hbs'}));
app.set('view engine', 'hbs');

// helpers for the handlebar templating platform
handlebars = handlebars.create({
    helpers: {
			format_date: function (date) { return moment(date).format("DD/MM/YYYY"); },
			custom_date: function (date, format) { return moment(date).format(format); },
			condensed_date: function (date) { return moment(date).format("DD/MM/YYYY"); },
			website_title: function () { return config.website_title; },
			post_status_text: function (status) { if(status === '0'){ return "Draft";}else{ return "Published" }},
			post_status_class: function (status) { if(status === '0'){ return "danger";}else{ return "success" }},
			get_tag_array: function (tags) {var tags = tags.split(',');var tags_array = [];for(var tag in tags){if(tags[tag].trim() != ""){tags_array.push(tags[tag].trim());}}return tags_array;},
			times: function (n, block) {var accum = '';for(var i = 1; i < n; ++i)accum += block.fn(i);return accum;}, 
			url_encode: function (url){ url = url.replace(/ /g,"-"); url = url.replace(/#/g,""); return url},
			ifCond: function (v1, operator, v2, options) {
				switch (operator) {
					case '==':
						return (v1 == v2) ? options.fn(this) : options.inverse(this);
					case '!=':
						return (v1 != v2) ? options.fn(this) : options.inverse(this);
					case '===':
						return (v1 === v2) ? options.fn(this) : options.inverse(this);
					case '<':
						return (v1 < v2) ? options.fn(this) : options.inverse(this);
					case '<=':
						return (v1 <= v2) ? options.fn(this) : options.inverse(this);
					case '>':
						return (v1 > v2) ? options.fn(this) : options.inverse(this);
					case '>=':
						return (v1 >= v2) ? options.fn(this) : options.inverse(this);
					case '&&':
						return (v1 && v2) ? options.fn(this) : options.inverse(this);
					case '||':
						return (v1 || v2) ? options.fn(this) : options.inverse(this);
					default:
						return options.inverse(this);
				}
			},
		}
});

// environment setup
app.set('port', process.env.PORT || 3000);
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(multer({ dest: './public/tmp/'}))
app.use(bodyParser.urlencoded())
app.use(cookieParser('5TOCyfH3HuszKGzFZntk'));
app.use(session({
	expires: new Date(Date.now() + 60 * 10000), 
	maxAge: 60*10000
}));
app.use(express.static(path.join(__dirname, 'public')));

// Make stuff accessible to our router
app.use(function(req,res,next){
    req.db = db;
	req.configurator = configurator;
	req.index_configurator = index_configurator;
	req.node_pagination = node_pagination;
	req.marked = marked;
	req.moment = moment;
	req.bcrypt = bcrypt;
	req.handlebars = handlebars;
	req.string = string;
    next();
});

// setup the routes
app.use('/page/', page);
app.use('/admin/', admin);
app.use('/tag/', tag);
app.use('/', routes);

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// Lift the app
app.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
