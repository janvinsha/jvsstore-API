const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
///
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res,req) => {
  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure:false
  });
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });
  //send confirmation email token
  const confirmToken = newUser.createEmailConfirmToken();
  await newUser.save({ validateBeforeSave: false });
  //3)SEND IT TO USERS EMAIL
  try {
    const confirmURL = `${req.protocol}://${req.get(
      'host'
    )}/?verify=${confirmToken}`;
    await new Email(newUser,confirmURL).sendWelcome()
} catch (err) {
  newUser.emailConfirmToken = undefined
      newUser.emailConfirmTokenExpires = undefined
      await newUser.save({ validateBeforeSave: false });   
 ;}
 createSendToken(newUser, 200, res,req)
});
exports.resendConfirmEmail = catchAsync(async (req, res, next) => {
  const user = req.user;
  //send confirmation email address
  const confirmToken = user.createEmailConfirmToken();
  await user.save({ validateBeforeSave: false });
  //3)SEND IT TO USERS EMAIL
 
  try {
    const confirmURL = `${req.protocol}://${req.get(
      'host'
    )}/?verify=${confirmToken}`;  
      await new Email(user,confirmURL).sendConfirmEmail() 
    res.status(200).json({
      status: 'Success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.emailConfirmToken = undefined;
    user.emailConfirmTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error trying to send email!. Try again later',
        500
      )
    );
  }
});
exports.confirmEmail = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    emailConfirmToken: hashedToken,
    emailConfirmTokenExpires: { $gt: Date.now() },
  });
  //2Set new password if token has not expired and there is a user
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.emailConfirmStatus = true;
  user.emailConfirmToken = undefined;
  user.emailConfirmTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });
  //4)Dont log user in
  res.status(200).json({
    status:"success"
  })
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //if email||username and passwors exist
  if (!email || !password) {
    return next(
      new AppError('Please provide email or username and password'),
      400
    );
  }
  //check if user exists&&password is correct
  const user = await User.findOne({
    email,
  }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //if everything is okay send token to user
  createSendToken(user, 200, res,req);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1)Get the token and check if it  there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  //2)validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists', 402)
    );
  }
  //4)Check if user changed password after token was issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!. Please log in again', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});


exports.loggedInUser = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1)verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2)Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //3)Check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //GRANT ACCESS TO PROTECTED ROUTE
      req.params.id = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};



exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin', 'moderator'].role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)GET YOUR USER BASED POSTED EMAIl
  const user = await User.findOne({ email: req.body.email });
  //2)GENERATE RANDOM RESEt TOKEN
  if(user){
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    //3)SEND IT TO USERS EMAIL
    try {
      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/resetPassword/${resetToken}`;
  await new Email(user,resetURL).sendPasswordReset()
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      (user.passwordResetToken = undefined),
        (user.passwordResetExpires = undefined),
        await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email,Try again later!.',
          500
        )
      );
    }
  }
  res.status(200).json({
    status: 'success',
    message: 'Token sent to email if it exists!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');

  //2Set new password if token has not expired and there is a user
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  //3) make sure new password is not same as old password
  if (await user.correctPassword(req.body.password, user.password)) {
    return next(new AppError('You cant use your former password', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //4 update the passwordChangedAt property for user

  //45)Dont log user in
res.status(200).json({
  status:"success"
})
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get user from collection
  const user = await User.findById(req.user._id).select('+password');
  //2) Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  //3) make sure current password is not same as posted password
  if (await user.correctPassword(req.body.password, user.password)) {
    return next(new AppError('You cant use your former password', 401));
  }
  //4)if so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //user.findByIdAndUpdate will not work
  //5)Log user in with new password updated
  createSendToken(user, 200, res,req);
});
