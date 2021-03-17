const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    photo: { type: String, default: 'default.jpg' },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password should have atleast 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password should have atleast 8 characters'],
      //only works when you are saving new user
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailConfirmStatus: {
      type: Boolean,
      default: false,
    },
    emailConfirmToken: String,
    emailConfirmTokenExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    photo: {
      name: { type:String ,default:"default.jpeg"},
    url: {type:String, default:"http://127.0.0.1:5000/api/v1/uploads/default.jpeg"},}
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//Virtual populate
usersSchema.virtual('orders', {
  ref: 'Order',
  foreignField: 'user',
  localField: '_id',
});
//password will be hashed beforre its saved
usersSchema.pre('save', async function (next) {
  //run this is password was modified
  if (!this.isModified('password')) return next();
  //hash password with cost of 12 meaning the strength needed to hack it
  this.password = await bcrypt.hash(this.password, 12);
  //delete the password confirmed field
  this.passwordConfirm = undefined;
  next();
});

usersSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//
usersSchema.pre(/^find/, function (next) {
  //this points to currrent query
  this.find({ active: { $ne: false } });
  next();
});
//
usersSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

usersSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  //false means password was not changed
  return false;
};
usersSchema.methods.createEmailConfirmToken = function () {
  const confirmToken = crypto.randomBytes(32).toString('hex');
  this.emailConfirmToken = crypto
    .createHash('sha256')
    .update(confirmToken)
    .digest('hex');
  this.emailConfirmTokenExpires = Date.now() + 1 * 24 * 60 * 1000;
  return confirmToken;
};

usersSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', usersSchema);
module.exports = User;
