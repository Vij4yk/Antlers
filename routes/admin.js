var express = require('express');
var router = express.Router();

router.get('/', restrict, function(req, res) {
	var db = req.db;
	
	res.redirect('/admin/dashboard/');
})

router.get('/media', restrict, function(req, res) {
	// override the default layout and view directory
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	
	
	res.render('admin_media');
})

router.get('/dashboard', restrict, function(req, res) {
	render_dashboard(req, res);
})

function render_dashboard(req, res){
	var db = req.db;
	var app = req.app;
	var sess = req.session;
	var configurator = req.configurator.get_config();
	var helpers = req.handlebars.helpers;
	var message = "";
	var message_type = "";
	
	// set the flash messages to local variables to be used on this
	// request, then clearing the session variables
	if(req.session.message){
		message = sess.message;
		req.session.message = null;
	}
	
	if(req.session.message_type){
		message_type = sess.message_type;
		req.session.message_type = null;
	}
	
	// override the default layout and view directory
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	
	
	db.posts.find({}).sort({post_date: -1}).exec(function (err, post_list) {
		res.render('admin_dashboard', { 
						"config": configurator, 
						title: 'Admin - Posts', 
						"posts": post_list,
						"post_count": post_list.length,
						helpers: helpers,
						"message": message, 
						"message_type": message_type, 
					});
	});
}

router.get('/preview/:id', restrict, function(req, res) {
	var db = req.db;
	var sess = req.session;
	var message = "";
	var message_type = "";
	var configurator = req.configurator.get_config();
	var app = req.app;
	var moment = req.moment;
	var marked = req.marked;
	var helpers = req.handlebars.helpers;
		
	// get local vars from session
	var sess_array = get_session_array(sess);
	
	db.posts.find({"post_id": Number(req.params.id)}, function (err, post) {
		if(post.length > 0){
			post_title = post[0].post_title;
			post_body = marked(post[0].post_body)
			post_date = post[0].post_date;
			post_tags = post[0].post_tags;
			post_status = post[0].post_status;
			post_static_page = post[0].post_static_page;
			
			// override the default layout and view directory
			app.locals.layout = "admin_layout.hbs";
			app.locals.settings.views = __dirname + "../../views/";	
				
			res.render('admin_preview', { 
								"config": configurator, 
								"header": "Edit Post", 
								"post_id": post[0].post_id, 
								"message": sess_array["message"], 
								"message_type": sess_array["message_type"], 
								"post_title": post_title, 
								"post_body": post_body, 
								"post_date": moment(post_date).format("DD/MM/YYYY"),
								"post_tags": helpers.get_tag_array(post_tags), 
								"post_status": post_status, 
								title: 'Admin - Preview', 
								"post_static_page": post_static_page,
								helpers: helpers
								});
		}else{
			req.session.message = "Post ID not found";
			req.session.message_type = "danger";
			res.redirect('/admin/dashboard');
		}
	});
});

router.get('/users/new', function(req, res) {
	var app = req.app;
	var configurator = req.configurator.get_config();
	var db = req.db;
	var message = "";
	var message_type = "";
	// overide the default layout
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	
	
	res.render('admin_users',
				{
					"config": configurator, 
					"message": message,
					"message_type": message_type,
					title: 'Admin-Users',
					'function': 'new',
					'panel_title': 'New user',
					'submit_text': 'Add user'
				});
});

router.get('/users', restrict, function(req, res) {
	var app = req.app;
	var configurator = req.configurator.get_config();
	var db = req.db;
	var message = "";
	var message_type = "";
	
	// overide the default layout
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	

	db.users.find({user_email: req.session.user}).exec(function (err, user) {
		res.render('admin_users',
					{
						"config": configurator, 
						"message": message,
						"message_type": message_type,
						"user": user,
						title: 'Admin-Users',
						'function': 'edit',
						'panel_title': 'My account',
						'submit_text': 'Update user'
					});
	});
});

router.get('/login', function(req, res) {
	var config = req.config;
	var app = req.app;
	var db = req.db;
	var message = "";
	var message_type = "";
	// overide the default layout
	app.locals.layout = "admin_login_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	
	 
	// if we have a user
	db.users.count({}, function (err, count) {
		if(count == 0){
			res.render('admin_signup', { "config": config, "message": "No accounts exist. Please create the initial account", "message_type": "danger", title: 'Admin - Signup' });
		}else{
			res.render('admin_login', { "config": config, "message": message, "message_type": message_type, title: 'Admin - Login'});
		}
	});
});

router.post('/user/action_edit', function(req, res){
	var db = req.db;
	var bcrypt = req.bcrypt;
	var users_name = req.body.frm_users_name;
	var email_add = req.body.frm_email1;
    var password = req.body.frm_password;
    var user_id = req.body.frm_users_id;
	
	// update the db
	db.users.update({_id: user_id },{$set:{
											user_name: users_name
										   ,user_email: email_add
										   ,user_password: bcrypt.hashSync(password)
								    }}, function (err, numReplaced) {
		db.users.persistence.compactDatafile();
		req.session.user = email_add;
		req.session.message = "User successfully updated";
		req.session.message_type = "success";
		res.redirect('/admin/users/');
	});
});

router.post('/user/action_new', function(req, res){
	var db = req.db;
	var bcrypt = req.bcrypt;
	var users_name = req.body.frm_users_name;
	var email_add = req.body.frm_email1;
    var password = req.body.frm_password;
	
	var doc = { user_name: users_name
			   , user_email: email_add
			   , user_password: bcrypt.hashSync(password)
			   };
			   
	db.users.insert(doc, function (err, newDoc) {
		if(err){
			console.log(err);
		}else{
			// signup is successfull
			req.session.user = email_add;
			req.session.message = "Welcome aboard";
			req.session.message_type = "success";
			res.redirect('/admin/users/');
		}
	});
});

router.post('/action_login', function(req, res){
	var config = req.config;
	var db = req.db;
	var bcrypt = req.bcrypt;
	var email_add = req.body.email_address;
    var password = req.body.password;
	
	db.users.find({}).sort({user_email: email_add}).exec(function (err, users) {	
		if(err){
			render_login_fail(config, req, res);
		}else{
			if(users.length > 0){
				// we have found a user. Now we compare the hash
				var db_hash = users[0].user_password;
				
				// compare password with hash in db
				if(bcrypt.compareSync(password, db_hash) == true){
					req.session.regenerate(function(){
						req.session.user = email_add;
						req.session.message = null;
						req.session.message_type = null;
						res.redirect('/admin');
					});
				}else {
					render_login_fail(config, req, res);
				}   
			}else{
				render_login_fail(config, req, res);
			}
		}
	});
});

// kill the session and log the user out
router.get('/logout', function(req, res){
    req.session.destroy(function(){
        res.redirect('/admin/login');
    });
});	

// Catch hits to "editor" and no ID supplied. Alert and redirect to dashboard
router.get('/editor', restrict, function(req, res) {
	req.session.message = "Error: Post ID not found";
	req.session.message_type = "danger";
	res.redirect('/admin/dashboard/');
});	

// New post editor
router.get('/editor/new', restrict, function(req, res) {
	var sess = req.session;
	var app = req.app;
	var helpers = req.handlebars.helpers;
	var moment = req.moment;
	var configurator = req.configurator;
	
	// get local vars from session
	var sess_array = get_session_array(sess);
	
	// override the default layout and view directory
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";		
	
	res.render('admin_editor', 
				{ 
					"config": configurator.get_config(), 
					"header": "New Post", 
					"post_id": "", 
					"message": sess_array["message"], 
					"message_type": sess_array["message_type"], 
					"post_date": moment().format('DD/MM/YYYY HH:mm'),
					"post_title": sess_array["post_title"], 
					"post_body": sess_array["post_body"], 
					"post_tags": sess_array["post_tags"], 
					title: 'Admin - New page', 
					helpers: helpers
				});
});

// Editing an existing post
router.get('/editor/:id', restrict, function(req, res) {
	var db = req.db;
	var sess = req.session;
	var marked = req.marked;
	var app = req.app;
	var helpers = req.handlebars.helpers;
	var moment = req.moment;
	var configurator = req.configurator.get_config();
		
	// get local vars from session
	var sess_array = get_session_array(sess);
	
	// override the default layout and view directory
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	
	
	db.posts.find({ "post_id": Number(req.params.id) }).sort({ post_date: -1 }).exec(function (err, post){
		if(post.length > 0){
				post_title = post[0].post_title;
				post_title_clean = post[0].post_title_clean;
				post_body = post[0].post_body;
				post_date = post[0].post_date;
				post_tags = post[0].post_tags;
				post_status = post[0].post_status;
				post_static_page = post[0].post_static_page;
				db_id = post[0]._id;
				
				res.render('admin_editor', { 
										"config": configurator, 
										"header": "Edit Post", 
										"post_id": post[0].post_id, 
										"message": sess_array["message"], 
										"message_type": sess_array["message_type"], 
										"db_id": db_id, 
										"post_title": post_title, 
										"post_title_clean": post_title_clean, 
										"post_body": post_body, 
										"post_date": moment(post_date).format('DD/MM/YYYY HH:mm'), 
										"post_tags": post_tags, 
										"post_status": post_status, 
										"post_static_page": post_static_page,
										title: 'Admin - Posts', 
										helpers: helpers
									});
		}else{
			// get all posts and show a message to advise the post ID does not exist
			req.session.message = "Error: Post ID not supplied";
			req.session.message_type = "danger";
			res.redirect('/admin/dashboard');
		}
	});
});

// delete post by ID
router.get('/deletepost/:id', restrict, function(req, res) {
	var db = req.db;
	
	// remove the record requested
	db.posts.remove({ "post_id": Number(req.params.id)}, {}, function (err, numRemoved) {
		if(err){
			req.session.message = "Error " + err;
			req.session.message_type = "danger";
			res.redirect('/admin/editor/' + req.body.frm_post_id);
		}else{
			db.posts.persistence.compactDatafile();
			req.session.message = "Post successfully deleted";
			req.session.message_type = "success";
			res.redirect('/admin/');
		}
	});
});

// base64 encode uploaded logo files
function base64_encode(file) {
    var fs = require('fs');
	var buffer = fs.readFileSync(file);
	return buffer.toString("base64");
}

// clears the base64 encoded image string from the settings file
router.get('/clearlogo', function(req, res) {
	var configurator = req.configurator;
	var config_array = configurator.get_config();
	var config_string = "";
	
	// clear the array value
	config_array["blog_logo"] = "";
	
	// build the config string and remove the "blog_logo" element
	for (var i in config_array) {
		if(i != "" && i != "blog_logo"){
			config_string = config_string + i + "~~" + config_array[i] + "\n";
		}
	}
	// save the settings
	configurator.write_config(config_string);
	
	// show success message and redirect
	req.session.message = "Successfully saved settings";
	req.session.message_type = "success";
	res.redirect('/admin/settings');
});

// render the settings view
router.post('/savesettings', function(req, res) {
	var configurator = req.configurator;
	var fs = require('fs');
	var sess = req.session;
	var helpers = req.handlebars.helpers;
	var sess_array = get_session_array(sess);
	var config_string = "";
	
	// get the themes array
	var themes = fs.readdirSync("public/themes");
	
	if(req.files.blog_logo){
		// upload file is present, now Base64 encode and save
		var imagePath = req.files.blog_logo.path;
		var encoded_image = base64_encode(imagePath);
		// delete the temp image file after we have the base64 has of it
		fs.unlinkSync(imagePath);
		req.body.blog_logo = encoded_image;
	}else{
		req.body.blog_logo = configurator.get_config().blog_logo;
	}
	
	for (var i in req.body) {
		// remove line breaks from analytics code before saving to config
		if(i == "blog_google_analytics"){
			if(req.body[i].length > 1){
				var line_breaks_removed = req.body[i].replace(/(\r\n|\n|\r)/gm,"");
				config_string = config_string + i + "~~" + line_breaks_removed + "\n";
			}
		}else{
			config_string = config_string + i + "~~" + req.body[i] + "\n";
		}
	}
	
	// if the google analytics textarea is blank we append the field anyway as the "req.body" does not include blank textareas
	if(req.body["blog_google_analytics"] == null){
		config_string = config_string + "blog_google_analytics~~\n";
	}
	
	// if the blog description textarea is blank we append the field anyway as the "req.body" does not include blank textareas
	if(req.body["blog_description"] == null){
		config_string = config_string + "blog_description~~\n";
	}
	
	// write the sessions to file
	var result = configurator.write_config(config_string);
	
	// show flash message
	if(result == false){
		req.session.message = "Failed to save settings";
		req.session.message_type = "danger";
		res.redirect('/admin/settings');
	}else{
		req.session.message = "Successfully saved settings";
		req.session.message_type = "success";
		res.redirect('/admin/settings');
	}
});

// render the settings view
router.get('/settings', restrict, function(req, res) {
	var app = req.app;
	var fs = require('fs');
	var configurator = req.configurator.get_config();
	var sess = req.session;
	var helpers = req.handlebars.helpers;
	var sess_array = get_session_array(sess);
	
	// get the themes array
	var themes = fs.readdirSync("public/themes");
	
	// override the default layout and view directory
	app.locals.layout = "admin_layout.hbs";
	app.locals.settings.views = __dirname + "../../views/";	
	
	res.render('admin_settings', { 
									"config": configurator, 
									title: 'Admin - Settings', 
									"message": sess_array["message"], 
									"message_type": sess_array["message_type"], 
									"themes": themes,
									helpers: helpers
								});
});

// save the post to the DB
router.post('/savepost', function(req, res) {
	var configurator = req.configurator;
	var db = req.db;
	var marked = req.marked;
	var flash = req.flash;
	var moment = req.moment;
	var app = req.app;
				
	// validate the post_title input data. It is required for all posts
	if(req.body.frm_post_title == ""){
		req.session.message = "Post title is required.";
		req.session.message_type = "danger";
		res.redirect('/admin/editor/' + req.body.frm_post_id);
		return;
	}
	
	// validate the post publish date input data. It is required for all posts
	if(req.body.frm_datetimepicker == ""){
		req.session.message = "Post date is required.";
		req.session.message_type = "danger";
		res.redirect('/admin/editor/' + req.body.frm_post_id);
		return;
	}
	
	// validate the post_body input data. It is required for all posts
	if(req.body.frm_post_body == ""){
		req.session.message = "Post body is required.";
		req.session.message_type = "danger";
		res.redirect('/admin/editor/' + req.body.frm_post_id);
		return;
	}
	
	// check if the static page is checked or not
	if(req.body.frm_static_page != "on"){
		req.body.frm_static_page = "off";
	}
			
	// set the DB fields 
	var db_values = { 
		$post_title: req.body.frm_post_title,
		$post_title_clean: clean_post_title(req.body.frm_post_title),
		$post_body: req.body.frm_post_body,
		$post_owner: req.session.user,
		$post_tags: req.body.frm_post_tags,
		$post_date: moment(req.body.frm_datetimepicker, 'DD/MM-YYYY HH:mm'),
		$post_status: req.body.frm_post_status,
		$post_static_page: req.body.frm_static_page
	};
	
	if(req.body.frm_save_type == "Edit Post"){ 
		// This is an edit of a post so it we do an update command		
		db.posts.update({_id: req.body.frm_db_id },{$set:{
													post_title: db_values["$post_title"],
													post_title_clean: db_values["$post_title_clean"],
													post_body: db_values["$post_body"],
													post_owner: db_values["$post_owner"],
													post_tags: db_values["$post_tags"],
													post_date: db_values["$post_date"]["_d"],
													post_status: db_values["$post_status"],
													post_static_page: db_values["$post_static_page"],
													post_id: Number(req.body.frm_post_id)
											  }}, function (err, numReplaced) {
			db.posts.persistence.compactDatafile();
			if(err) {
				if(err.errno == '19')
				{
					req.session.message = "Duplicate post title. Please change post title";
					req.session.message_type = "danger";
					return res.redirect('/admin/editor/' + req.body.frm_post_id);
				}
			} else {
				req.session.message = "Post successfully updated";
				req.session.message_type = "success";
				req.session.post_title = req.body.frm_post_title;
				req.session.post_body = req.body.frm_post_body;
				req.session.post_tags = req.body.frm_post_tags;
				req.session.post_status = req.body.frm_post_status;
				return res.redirect('/admin/editor/' + req.body.frm_post_id);
			}
			
			
		});
	}else{
		// This is a new post and should be inserted
		var new_post_id = 0;
		db.posts.findOne({}).sort({ "post_id": -1 }).exec(function (err, doc){
			// get the next logical post_id
			if(doc == null){
				new_post_id = 1;
			}else{
				new_post_id = Number(doc.post_id) + 1;
			}
			var doc = { "post_id": Number(new_post_id)
				   , post_title: db_values["$post_title"]
				   , post_title_clean: db_values["$post_title_clean"]
				   , post_body: db_values["$post_body"]
				   , post_owner: db_values["$post_owner"]
				   , post_tags: db_values["$post_tags"]
				   , post_date: db_values["$post_date"]["_d"]
				   , post_status: db_values["$post_status"]
				   , post_static_page: db_values["$post_static_page"]
				   };
			
			// check to see if post ID is existing
			db.posts.count({"post_title": db_values["$post_title"]}, function (err, post_count) {	
				// if there is a post we don't want to discard so we set a duplicate message to the title and redirect
				// the user back the editor to change straight away
				if(post_count > 0){
					doc["post_title"] = doc["post_title"] + " - THIS IS A DUPLICATE POST TITLE AND NEEDS CHANGING";
					doc["post_title_clean"] = doc["post_title_clean"] + "-THIS-IS-A-DUPLICATE-POST-TITLE-AND-NEEDS-CHANGING";
				}
				// commit to the db
				db.posts.insert(doc, function (err, newDoc) {
					if(post_count > 0){
						req.session.message = "Duplicate post title. Please change.";
						req.session.message_type = "danger";
						return res.redirect('/admin/editor/' + new_post_id);
					 }else{
						req.session.message = "Post successfully added";
						req.session.message_type = "success";
					}
					return res.redirect('/admin/preview/' + new_post_id);
				});
			});
		});
	}
});

// cleans the post title by removing any invalid characters
function clean_post_title(title)
{
	title = title.replace(/ /g,"-"); // replace spaces with dashes
	title = title.replace(/[$&+,/;:=?@"<\\>#%{}|^~\[\]']/g,""); // replace spaces with dashes
	return title;
}

// shows the login failed message
function render_login_fail(config, req, res)
{
	// overide the default layout
	var app = req.app;
	app.locals.settings.views = __dirname + "../../views/";	
	app.locals.layout = "admin_login_layout.hbs";
	
	// set the message in the session
	req.session.message = "Login failed. Please check your email and password and try again.";
	req.session.message_type = "danger";

	// render our view	
	res.render('admin_login', { "config": config, "message": req.session.message, "message_type": req.session.message_type, title: 'Admin - Login' });
}

// gets the session messages, sets them to a local array and clears the session variables. This essentially
// allows for flash messaging on the pages
function get_session_array(sess)
{
	// Check if a value is in the session. If so, clear the session 
	// value and assign to a local variable which is passed to our view
	var sess_array = {};
	if(sess.post_title){
		sess_array["post_title"] = sess.post_title;
		sess.post_title = null;
	}
	
	if(sess.post_body){
		sess_array["post_body"] = sess.post_body;
		sess.post_body = null;
	}
	
	if(sess.post_tags){
		sess_array["post_tags"] = sess.post_tags;
		sess.post_tags = null;
	}
	
	if(sess.post_status){
		sess_array["post_status"] = sess.post_status;
		sess.post_status = null;
	}
	
	if(sess.message){
		sess_array["message"] = sess.message;
		sess.message = null;
	}
	
	if(sess.message_type){
		sess_array["message_type"] = sess.message_type;
		sess.message_type = null;
	}
	
	return sess_array;
}

// checks if session exists and displays "Access denied" message and redirects to login
function restrict(req, res, next) {

	if (req.session.user){
		next();
	}else{
		req.session.message = "Access denied";
		req.session.message_type = "danger";
		res.redirect('/admin/login');
	}
}

// gets the file extension of a given file name
function getExtension(filename) {
	var path = require('path');
    var ext = path.extname(filename||'').split('.');
    return ext[ext.length - 1];
}

function get_all_posts(req, res, message, message_type) {
	var db = req.db;
	var app = req.app;
	var config = req.config;
	var marked = req.marked;
	var helpers = req.handlebars.helpers;
			
	db.posts.find({}).sort({post_date: 1}).exec(function (err, posts) {	
	// overide the default layout
		app.locals.layout = "admin_layout.hbs";	
		app.locals.settings.views = __dirname + "../../views/";	
		res.render('admin', { "config": config, "message": message, "message_type": message_type, "posts": posts, title: 'Admin - Dashboard', helpers: helpers });
	});
}

module.exports = router;