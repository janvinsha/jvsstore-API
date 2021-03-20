//ejshint esversion:6
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!! 💥💥💥 Shutting down....');
  process.exit(1);
});
//configure global variables
const dotenv = require('dotenv');
dotenv.config();
//require necessary parameters
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const morgan = require('morgan')
const app = express();
const compression = require('compression')
const _ = require('lodash');
const cors=require("cors")
//
app.enable('trust proxy')
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//
const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    });
    console.log(`MongoDB connected :${conn.connection.host}`);
  } catch (error) {
    console.log(`Error:${error.message}`);
    process.exit(1);
  }
};
connectDB();
mongoose.set('useCreateIndex', true);
//1)GLOBAL MIDDLEWARES
//Implement cors
//Access-Control-Allow-Origin *
app.use(cors({ origin:"https://janvinshastores.herokuapp.com",  credentials: true,}))
// app.options('*',cors()) do not allow other websites to delete
//Set Security HTTP headers
app.use(helmet())
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//limit request from same APO
const loginLimiter = rateLimit({
  max: 1,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this Ip, na wao, please try again later',
});
app.use('/api/v1/user/login', loginLimiter);
//Body parser, reading data from the body into req.body
const bodyParser = require('body-parser');
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.raw({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against cross scripting attacks XSS
app.use(xss());
//Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['price', 'slashedPrice', ' ratingAverage', 'ratingQuantity'],
  })
);
//
app.use(compression())
///test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);

  next();
});
////
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//routes

const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const orderRouter = require('./routes/orderRoutes')

//routing
app.use('/api/v1/products', productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orders', orderRouter)
//Serving static files
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));
//for UNDEFINED ROUTES
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
const port = process.env.PORT || 5000;
const server = app.listen(port, function () {
  console.log('Server started on port 5000');
});
///
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥💥💥 Shutting down....');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM',()=>{
  console.log('👋SIGTERM RECIEVED. Shutting down gracefully ');
  server.close(() => {
    console.log('💥Process terminated!');
  });
})