var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user');


router.get('/', function (req, res, next) {
    User.find({}, function (err, users) {
        res.render('index', {
            user: req.user,
            users: users,
            title: 'Express'
        });
    });
});

router.get('/login', function (req, res, next) {
    User.find({}, function (err, users) {
        res.render('login.ejs', {
            user: req.user,
            users: users,
            message: req.flash('loginMessage'),
            title: 'Login'
        });
    });
});

router.get('/signup', function (req, res) {
    res.render('signup.ejs', {
        user: req.user,
        message: req.flash('loginMessage'),
        title: 'signup'
    });
});

router.get('/profile', isLoggedIn, function (req, res) {
    User.find({}, function (err, users) {
        res.render('profile.ejs', {
            user: req.user,
            users: users
        });
    });
});

router.get('/tasks', isLoggedIn, function (req, res) {
    User.find({}, function (err, users) {
        res.render('tasks.ejs', {
            user: req.user,
            users: users
        });
    });
});

router.get('/assign', isLoggedIn, function (req, res) {
    User.find({}, function (err, users) {
        res.render('assignIssue.ejs', {
            user: req.user,
            users: users
        });
    });
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
}));

router.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'email'
}));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/',
}));

router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/',
}));

router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/profile',
    failureRedirect: '/',
}));

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}