import path from 'path';
import crypto from 'crypto';
import async from 'async';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import User from '../models/User';

import transporter from '../config/mail';


/**
 * POST /login
 * Sign in using email and password.
**/


exports.postLogin = (req, res, next) => {
  req.assert('email', 'E-mail not provided').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });
  const errors = req.validationErrors();

  if (errors) {
    const errorMessages = errors.map(e => e.msg);
    return res.status(401).json({
      error: true,
      errors: errorMessages
    });
  }


  User.findOne({
    email: req.body.email.toLowerCase()
  }, (err, user) => {
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid Username and Password'
      });
    }

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (isMatch) {
        const safeUserData = {
          _id: user._id,
          email: user.email,
          profile: user.profile,
        };

        const token = jwt.sign(safeUserData, process.env.JWT_SECRET);

        return res.status(200).json({
          token,
          message: 'Success! You are logged in.'
        });
      }

      return res.status(401).json({
        error: true,
        message: 'Invalid email or password.'
      });
    });
  });
};


/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  delete req.currentUser;
  return res.json({
    error: false,
    message: 'Successfully logged out.'
  });
};
/**
 * GET /signup
 * Signup page.
 */
// exports.getSignup = (req, res) => {
//     if (req.user) {
//         return res.redirect('/');
//     }
//     res.redirect('/signup');
//     // res.render('account/signup', {
//     //     title: 'Create Account'
//     // });
// };

/**
 * POST /signup
 * Create a new local account.
 */

exports.postSignup = (req, res, next) => {
  req.assert('name', 'Name should not be empty.').notEmpty();
  req.assert('email', 'Email should not be empty.').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 to 20 characters long').len(4, 20);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });
  req.assert('address', 'Address should not be empty.').notEmpty();
  req.assert('city', 'City should not be empty.').notEmpty();
  req.assert('pin', 'Pin should be valid').len(3, 6).isInt();
  req.assert('state', 'State should be specified.').notEmpty();
  req.assert('gender', 'Gender should be specified.').notEmpty();

  req.assert('phone', 'Phone number should not be empty').notEmpty();
  req.assert('phone', 'Phone number should be valid numbber').len(10);
  req.sanitize('name').escape();
  req.sanitize('address').escape();
  req.sanitize('city').escape();
  req.sanitize('pin').escape();
  req.sanitize('state').escape();
  const isDoctor = req.body.isDoctor && req.body.isDoctor === true;
  const isPatient = req.body.isPatient && req.body.isPatient === true;
  const isDonor = req.body.isDonor && req.body.isDonor === true;
  if (isDoctor) {
    req.assert('specialism', 'Speciality must not be empty.').notEmpty();
    req.sanitize('specialism').escape();
    req.assert('experience', 'Experience must be valid number').len(1, 2).isInt();
  }
  if (isPatient) {
    req.assert('disease', 'Disease should not be empty.').notEmpty();
    req.sanitize('disease').escape();
  }
  const errors = req.validationErrors();
  if (errors) {
    const errorMessages = errors.map(e => e.msg);
    return res.json({
      error: true,
      errors: errorMessages
    });
  }
  const userModel = {
    email: req.body.email,
    password: req.body.password,
    profile: {
      name: req.body.name,
      gender: req.body.gender,
      phone: req.body.phone,
      address: {
        address: req.body.address,
        city: req.body.city,
        pin: req.body.pin,
        state: req.body.state
      }
    }
  };
  if (isDoctor) {
    const doctorFields = {
      specialism: req.body.specialism,
      experience: req.body.experience
    };
    userModel.profile.isDoctor = true;
    userModel.profile.doctorFields = doctorFields;
  } else if (isPatient) {
    const patientFields = {
      disease: req.body.disease
    };
    userModel.profile.isPatient = true;
    userModel.profile.patientFields = patientFields;
  } else if (isDonor) {
    userModel.profile.isDonor = true;
  }
  User.findOne({
    email: req.body.email
  }, (err, existingUser) => {
    if (existingUser) {
      return res.json({
        error: true,
        message: 'Account with that email address already exists.'
      });
    }
    const user = new User(userModel);
    user.save((err) => {
      if (err) {
        return res.status(500).json({
          error: true,
          message: 'Internal server error.'
        });
      }

      const safeUserData = {
        _id: user._id,
        email: user.email,
        profile: user.profile
      };
      const token = jwt.sign(safeUserData, process.env.JWT_SECRET);
      res.json({
        token,
        message: 'Success! You are Signup and logged in.'
      });
    });
  });
};


/**
 * POST /account/profile
 * Update profile information.
 */


exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });
  req.assert('name', 'Name should not be empty.').notEmpty();
  req.assert('email', 'Email should not be empty.').notEmpty();
  const errors = req.validationErrors();
  if (errors) {
    const errorMessages = errors.map(e => e.msg);
    res.status(401).json({
      error: true,
      errors: errorMessages
    });
  }

  User.findById(req.currentUser._id, (err, user) => {
    if (err) {
      return res.status(500).json({
        error: true,
        message: 'Internal server error.'
      });
    }
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.address.address = req.body.address || '';
    user.profile.address.city = req.body.city || '';
    user.profile.address.pin = req.body.pin || 0;

    user.profile.address.state = req.body.state || '';

    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          return res.json({
            error: true,
            message: 'The email address you have entered is already associated with an account.'
          });
        }
        return res.status(500).json({
          error: true,
          message: 'Internal server error.'
        });
      }
      return res.json({
        error: false,
        message: 'Profile information has been updated.'
      });
    });
  });
};


/**
 * POST /account/password
 * Update current password.
 */

exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    res.json({
      error: true,
      errors
    });
  }

  User.findById(req.currentUser._id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save((err) => {
      if (err) {
        return next(err);
      }
      res.json({
        error: false,
        message: 'Password has been changed.'
      });
    });
  });
};


/**
 * POST /account/delete
 * Delete user account.
 */


exports.postDeleteAccount = (req, res, next) => {
  User.remove({

    _id: req.currentUser._id

  }, (err) => {
    if (err) {
      return next(err);
    }
    delete req.currentUser;
    // req.logout();
    // req.flash('info', { msg: 'Your account has been deleted.' });
    // res.redirect('/');
    return res.json({
      error: false,
      message: 'Your account has been deleted.'
    });
  });
};


/**
 * GET /reset/:token
 * Reset Password page.
 */

exports.getReset = (req, res, next) => {
  User
    .findOne({
      passwordResetToken: req.params.token
    })
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return res.status(500).json({
          error: true,
          message: 'Internal server error.'
        });
      }
      if (!user) {
        return res.redirect('/invalid');
      }
      next();
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */

exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    const errorMessages = errors.map(e => e.msg);

    res.json({
      error: true,
      errors: errorMessages
    });
  }

  async.waterfall([
    (done) => {
      User
        .findOne({
          passwordResetToken: req.params.token
        })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            res.json({
              error: true,
              message: 'Password reset token is invalid or has expired.'
            });
          }

          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save((err) => {
            if (err) {
              return next(err);
            }
            done(err, user);
          });
        });
    },
    (user, done) => {
      const mailOptions = {
        to: user.email,
        from: process.env.SITE_EMAIL,
        subject: 'Your manavjyot account\'s password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n` // eslint-disable-line
      };

      transporter.sendMail(mailOptions, (err) => {
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }

    res.json({
      error: false,
      message: 'Success! Your password has been changed.'
    });
  });
};


/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */


exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({
    remove_dots: false
  });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([

    (done) => {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    (token, done) => {
      User.findOne({
        email: req.body.email
      }, (err, user) => {
        if (!user) {
          return res.json({
            error: true,
            message: 'Account with that email address does not exist.'
          });
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    (token, user, done) => {
      const mailOptions = {
        to: user.email,
        from: process.env.SITE_EMAIL,
        subject: 'Reset your password on Manavjyot Charity Site',
        text: `
You are receiving this email because you (or someone else) have requested the reset of the password for your account.

Please click on the following link, or paste this into your browser to complete the process:

http://${req.headers.host}/reset/${token}

If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        console.log('Password reset e-mail sent to', user.email);
        if (err) {
          console.log('Email sending error', err);
        }
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return res.status(500).json({
        error: true,
        message: 'Error occurred.'
      });
    }
    return res.json({
      error: false,
      message: 'An e-mail has been sent to your e-mail with further instructions.'
    });
  });
};


exports.getUser = (req, res, next) => {
  if (req.currentUser) {
    return res.json({
      error: false,
      user: req.currentUser
    });
  }
  return res.status(401).json({
    error: true,
    message: 'unauthorised user'
  });
};


/**
 * POST /accout/upload
 * Upload Profile Picture
 */
const USER_UPLOAD_PATH = 'uploads/users';

const multerStorage = multer.diskStorage({
  destination: path.resolve(USER_UPLOAD_PATH),
  filename: (req, file, cb) => {
    if (req.currentUser) {
      const { _id } = req.currentUser;
      const extName = path.extname(file.originalname);
      const newFilename = `${_id}${extName}`;
      cb(null, newFilename);
    }
  }
});
const upload = multer({ storage: multerStorage }).single('profile_pic');

exports.uploadProfilePic = function uploadProfilePic(req, res) {
  upload(req, res, (err) => {
    if (err) {
      console.log('Error while uploading pricture');
      return res.status(500).json({
        error: true,
        message: err.message
      });
    }
    const { currentUser } = req;
    User
      .findById(currentUser._id)
      .exec()
      .then(user => {
        if (!user) {
          return res.status(500).json({
            error: true,
            message: 'Internal Server Error.'
          });
        }
        const { file } = req;
        const { filename } = file;
        const picturePath = `${USER_UPLOAD_PATH}/${filename}`;
        user.profile.picture = picturePath;
        user.save((err, u) => {
          if (err) {
            return res.status(500).json({
              error: true,
              message: 'Internal server error'
            });
          }
          return res.json({
            error: false,
            user: u,
            message: 'Profile Pic uploaed'
          });
        });
      })
      .catch(err => {
        return res.status(500).json({
          error: true,
          message: 'Internal Server Error'
        });
      });
  });
};
