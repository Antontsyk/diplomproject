var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var User = require('../models/user');
var configAuth = require('./auth');

var randomstring = require("randomstring");
var nodemailer = require('nodemailer');

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    /*  passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      function(req, email, password, done) {
        process.nextTick(function() {
          User.findOne({ 'local.email':  email }, function(err, user) {
            if (err)
                return done(err);
            if (user) {
              return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {
              var newUser = new User();
              newUser.local.email = email;
              newUser.local.password = newUser.generateHash(password);
              newUser.local.infoadd = "";
              newUser.local.tasks = [];
              newUser.save(function(err) {
                if (err)
                  throw err;
                  console.log(newUser);
                return done(null, newUser);
              });
            }
          });
        });
      }));*/


    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },

        function (req, email, password, done) {
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({'local.email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err) {
                        return done(err);
                    }

                    // check to see if theres already a user with that email
                    if (user) {
                        console.log('that email exists');
                        return done(null, false, req.flash('signupMessage', email + ' уже используется! '));

                    } else {
                        User.findOne({'local.email': req.body.email}, function (err, user) {
                            if (user) {
                                console.log('That username exists');
                                return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                            }

                            if (req.body.password != req.body.confirm_password) {
                                console.log('Passwords do not match');
                                return done(null, false, req.flash('signupMessage', 'Пароли не совпадают'));
                            }

                            else {
                                // create the user
                                var newUser = new User();

                                var permalink = req.body.email.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();

                                var verification_token = randomstring.generate({
                                    length: 64
                                });


                                newUser.local.email = email;
                                newUser.local.password = newUser.generateHash(password);
                                newUser.local.permalink = permalink;
                                //Verified will get turned to true when they verify email address
                                newUser.local.verified = false;
                                newUser.local.verify_token = verification_token;
                                try {
                                    var transporter = nodemailer.createTransport({
                                        host: 'smtp.yandex.ru',
                                        port: 465,
                                        secure: true,
                                        auth: {
                                            user: 'startupmap@we.guru',
                                            pass: 'startupmap2007'
                                        },
                                        tls: {
                                            // do not fail on invalid certs
                                            ciphers:'SSLv3',
                                            rejectUnauthorized: false
                                        }
                                    });

                                    var mailOptions = {
                                        from: 'startupmap@we.guru',
                                        to: email,
                                        subject: 'Account Verification Token',
                                        text: 'Hello,\n\n' + 'Please verify your account by clicking the link: <a href=" \nhttp:\/\/' + req.headers.host + '\/verify\/' + permalink + '/' + verification_token + '">.\n'
                                    };
                                    transporter.sendMail(mailOptions, function (err) {

                                        if (err) {
                                            return done(null, false, req.flash('signupMessage', 'Что-то пошло не так! Попробуйте ещё раз!'));
                                        }
                                        newUser.save(function (err) {
                                            if (err) {
                                                throw err;
                                            } else {
                                                //VerifyEmail.sendverification(email, verification_token, permalink);
                                                // Send the email
                                                return done(null, false, req.flash('signupMessageSuccess', 'Зайдите на вашу почту ' + email + 'и подтвердите её перейдя по ссылке в письме'));

                                            }
                                        });
                                    });
                                } catch (err) {

                                }
                            }
                        });

                    }
                });
            });
        }));

    passport.use('local-login', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true,
        },
        function (req, email, password, done) {
            User.findOne({'local.email': email}, function (err, user) {
                if (err)
                    return done(err);
                if (!user.local.verified)
                    return done(null, false, req.flash('loginMessage', 'Вам нажно подтвердить ваш почту!'));
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                return done(null, user);
            });
        }));

    passport.use(new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL,
            profileFields: ['id', 'email', 'first_name', 'last_name'],
        },
        function (token, refreshToken, profile, done) {
            process.nextTick(function () {
                User.findOne({'facebook.id': profile.id}, function (err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, user);
                    } else {
                        var newUser = new User();
                        newUser.facebook.id = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

    passport.use(new TwitterStrategy({
            consumerKey: configAuth.twitterAuth.consumerKey,
            consumerSecret: configAuth.twitterAuth.consumerSecret,
            callbackURL: configAuth.twitterAuth.callbackURL,
        },
        function (token, tokenSecret, profile, done) {
            process.nextTick(function () {
                User.findOne({'twitter.id': profile.id}, function (err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, user);
                    } else {
                        var newUser = new User();
                        newUser.twitter.id = profile.id;
                        newUser.twitter.token = token;
                        newUser.twitter.username = profile.username;
                        newUser.twitter.displayName = profile.displayName;
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

    passport.use(new GoogleStrategy({
            clientID: configAuth.googleAuth.clientID,
            clientSecret: configAuth.googleAuth.clientSecret,
            callbackURL: configAuth.googleAuth.callbackURL,
            passReqToCallback: true,
            enableProof: false,
            session: false,
        },
        function (req, token, refreshToken, profile, done) {
            console.log('profile');
            console.log(profile);
            process.nextTick(function () {
                User.findOne({'google.id': profile.id}, function (err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, user);
                    } else {
                        var newUser = new User();
                        newUser.google.id = profile.id;
                        newUser.google.token = token;
                        newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value;
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));

};
