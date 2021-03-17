const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: 
  ${err.value}.`;
  return new AppError(message, 400);
};
// const handleDuplicateFieldsDB = (err) => {
//   const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
//   console.log(value);
// // if( err.error.keyPattern.userName==1
// // ){
// //   const message = `Username not available, Try another username`;
// //   return new AppError(message, 400);
// // }

//   const message = `Duplicate field value:${value}. Please use another value`;
//   return new AppError(message, 400);
// };
const handleDuplicateFieldsDB = err => {

  if(err.keyPattern.email===1){
    const message ='Email already in use! ';
    return new AppError(message, 400);
  }
  if(err.keyPattern.product==1&&err.keyPattern.user==1){
    const message ='You can only write review once';
    return new AppError(message, 400);
  }
  if(err.keyPattern.product===1){
    const message ='Username not available!. Please try another username';
    return new AppError(message, 400);
  }

  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid Input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', 401);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    errmsg: err.errmsg,
  });
};
const sendErrorProd = (err, res) => {
  //Operational error trusted send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //Programming or any other unknown error
  } else {
    //1)log error
    console.error('Error💥', err, err.name);
    ///2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
  
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production')
  {
  if (err.name === 'CastError') err = handleCastErrorDB(err);
  if (err.code === 11000) err = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError')
    err = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') err = handleJWTError();
  if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();

  sendErrorProd(err, res);
}};
