const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const session = require('express-session');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'rk89450@gmail.com',
    clientId: '849347787041-jdkh7m93g6q62ueq034s4togqnh2gsgi.apps.googleusercontent.com',
    clientSecret: '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',
    refreshToken: 'YOUR_REFRESH_TOKEN',
    accessToken: 'YOUR_ACCESS_TOKEN'
  }
});

app.get('/oauth2callback', async (req, res) => {
  const authorizationCode = req.query.code;

  // Exchange the authorization code for a refresh token and access token
  const data = {
    code: authorizationCode,
    client_id: '849347787041-jdkh7m93g6q62ueq034s4togqnh2gsgi.apps.googleusercontent.com',
    client_secret: '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',
    redirect_uri: 'http://localhost:3000/oauth2callback', // replace with your actual redirect URI
    grant_type: 'authorization_code'
  };

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', data);
    const { access_token, refresh_token } = response.data;

    // Save the access token and refresh token to the user's record in the database
    // You'll need to implement this part based on how your database is set up

    res.send('Email has been verified and tokens have been received.');
  } catch (error) {
    console.error(error);
    res.send('Error exchanging authorization code for tokens.');
  }
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
  // Send a response back to the client
  res.json({ status: 'success', message: 'Logged in successfully' });
});

app.get('/logout', (req, res) => {
  req.logout();
  // Send a response back to the client
  res.json({ status: 'success', message: 'Logged out successfully' });
});

console.log('Starting server...');
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:37017/test')
  .then(() => {
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      resetPasswordToken: String,
      resetPasswordExpires: Date,
      emailVerificationToken: String, // New field for email verification token
    });

    UserSchema.pre('save', async function(next) {
      const user = this;
      if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
      }
      next();
    });

    const User = mongoose.model('User', UserSchema);

    passport.use(new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      }
    ));

    app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
      res.redirect('/');
    });

    app.post('/register', async (req, res) => {
      const { username, email, password } = req.body;
      const user = new User({ username, email, password });

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(20).toString('hex');
      user.emailVerificationToken = emailVerificationToken;

      await user.save();

      // Send verification email
      let mailOptions = {
        from: 'rk89450@gmail.com',
        to: user.email,
        subject: 'Email Verification',
        text: 'Please verify your email by clicking on the following link, or paste this into your browser:\n\n' +
          'http://localhost:3000/verify-email/' + emailVerificationToken + '\n\n'
      };

      transporter.sendMail(mailOptions, function(err, info){
        if (err) {
          console.log(err);
          res.send('Error sending email');
        } else {
          console.log('Email sent: ' + info.response);
          res.send('Verification email has been sent.');
        }
      });
    });

    app.get('/verify-email/:token', async (req, res) => {
      const { token } = req.params;
      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        return res.send('Email verification token is invalid.');
      }

      user.emailVerificationToken = undefined;
      await user.save();

      res.send('Email has been verified.');
    });

    app.post('/reset-password', async (req, res) => {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.send('No account with that email address exists.');
      }

      // Create reset token and set expiry
      const token = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await user.save();

      // Send email with `token` to user's email address
      let mailOptions = {
        from: 'rk89450@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n' +
          'http://localhost:3000/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };

      transporter.sendMail(mailOptions, function(err, info){
        if (err) {
          console.log(err);
          res.send('Error sending email');
        } else {
          console.log('Email sent: ' + info.response);
          res.send('Password reset email has been sent.');
        }
      });
    });

    app.post('/new-password', async (req, res) => {
      const { token, newPassword } = req.body;
      const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
      if (!user) {
        return res.send('Password reset token is invalid or has expired.');
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.send('Password has been updated.');
    });

  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});