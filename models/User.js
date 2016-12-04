import crypto from 'crypto';
import bcrypt from 'bcrypt-nodejs';
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, unique: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,

  profile: {
    name: { type: String, default: '' },
    gender: { type: String, default: '' },
    // dob: { type: Date },
    isDoctor: { type: Boolean, default: false },
    isDonor: { type: Boolean, default: false },
    isPatient: { type: Boolean, default: false },

    address: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      pin: { type: Number },
      state: { type: String, default: '' },
    },
    doctorFields: {
      specialism: String,
      experience: Number
    },
    patientFields: {
      disease: String
    },
    picture: { type: String, default: '' },
    phone: { type: Number, required: true }
  },
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

export default mongoose.model('User', userSchema);
