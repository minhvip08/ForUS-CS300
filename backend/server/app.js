const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');

const setupRoute = require('./routers');
const { set } = require('mongoose');

// // Middleware
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

app.use(morgan('dev'));

app.use(express.json());
app.use(cookieParser());
// app.use(session({
// 	secret: process.env.SECRET,
// 	cookie: {
// 		maxAge: 30 * 24 * 60 * 60 * 1000 // max cookie age 1 month
// 	},
// 	saveUninitialized: false,
// 	resave: false
// }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
 

// Data sanitization against XSS
app.use(xss());

var allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://forus-cs300.onrender.com',
  'https://for-us-cs-300-vvtm.vercel.app'
];

app.use(cors({
  credentials: true,
  origin: function(origin, callback){
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Set security HTTP headers
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(compression());

// Routes
setupRoute(app);


module.exports = app;
