var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
require('https').globalAgent.options.rejectUnauthorized = false;

var port = process.env.PORT || 3000;

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');
var flash = require('connect-flash');
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'shhsecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var User = require('./models/user');

app.get('/verify/:permaink/:token', function (req, res) {
    var permalink = req.params.permaink;
    var token = req.params.token;

    User.findOne({'local.permalink': permalink}, function (err, user) {
        if (user.local.verify_token == token) {
            console.log('that token is correct! Verify the user');

            User.findOneAndUpdate({'local.permalink': permalink}, {'local.verified': true}, function (err, resp) {
                console.log('The user has been verified!');
            });

            res.redirect('/login');
        } else {
            console.log('The token is wrong! Reject the user. token should be: ' + user.local.verify_token);
        }
    });
});

app.post('/setLocation', function (req, res) {
    User.findById(req.body.idUser, function (err, user) {
        if (err) return handleError(err);
        user.local.locations.unshift({
            name: req.body.name,
            place: {lat: req.body.location_lat, lng: req.body.location_lng},
            category: req.body.category,
            count_osnovatelei: req.body.count_osnovatelei,
            step_project: req.body.step_project,
            need: req.body.need,
            website: req.body.website,
            dop_text: req.body.dop_text
        });
        user.save(function (err) {
            if(err) console.error(err);
        });
        res.status(200).send('success');
    });
});


app.get('/getAllLocations', function (req, res) {
    User.find({}, function (err, users) {
        var userMap = {};
        users.forEach(function (user) {
            userMap[user._id] = user.local.locations;
        });
        if (err) return handleError(err);
        res.status(200).json(userMap);
    })
});

app.get('/getLocationsUser/:UserId', function (req, res) {
    User.findById(req.params.UserId, function (err, user) {
        if (err) return handleError(err);
        res.status(200).json(user.local.locations);
    })
});

app.post('/changeLocation', function (req, res) {
    var UserId = req.body.idUser;
    var nameLocation = req.body.name;
    var category = req.body.category;

    console.log(UserId);
    User.update({
            _id: UserId,
            "local.locations.name": nameLocation
        }, {
            $set: {
                "local.locations.$": {
                    name: req.body.name,
                    place: {lat: req.body.location_lat, lng: req.body.location_lng},
                    category: req.body.category,
                    count_osnovatelei: req.body.count_osnovatelei,
                    step_project: req.body.step_project,
                    need: req.body.need,
                    website: req.body.website,
                    dop_text: req.body.dop_text
                }
            }
        },
        function (err, tank) {
            if (err) {
                console.log(tank);
                return handleError(err);

            } else {
                console.log(tank);
                res.status(200).send('OK');
            }
        }
    );
});

/*app.post('/changestatus', function (req, res) {
    var UserId = req.body.idUser;
    var nameLocation = req.body.task_name;

    var namet = "local.tasks." + 1;
    User.update({
            _id: UserId,
            "local.tasks.task": task_name
        }, {
            $set: {
                "local.tasks.$.status": status
            }
        },
        function (err, tank) {
            if (err) return handleError(err);
            console.log(tank);
        }
    );

    //res.render('tasks.ejs');     
    res.redirect('back');
});*/


require('./config/passport')(passport);

app.use('/', routes);
app.use('/users', users);

app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
        });
    });
}


app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
    });
});

app.listen(port);

module.exports = app;