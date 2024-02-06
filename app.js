const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose')
const session = require('express-session')
const { v4: uuid4 } = require("uuid");
const app = express();
const dotenv = require('dotenv') 

dotenv.config()
 
    
  
// data base connection

mongoose.connect(process.env.DATABASE_URL) 
  .then(() => {
    console.log("mongodb connected")
  })
  .catch((err) => {
    console.log("connection failed",err);
  });



//multer image path
app.use('/productImages', express.static(path.resolve(__dirname, 'productImages')));
 
//multer image for banners 
app.use('/banner',express.static(path.resolve(__dirname,'banner')))
   
// dotenv.config();


app.use(cookieParser()); 

app.use(express.json());
app.use(express.urlencoded({ extended: false }));




const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: uuid4(),
    resave: false,
    cookie: { maxAge: oneDay },
    saveUninitialized: true, 
  })
);

app.use( (req, res, next)=>{
  if (!req.user)
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  next();
});



const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
 


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(process.env.PORT, () => {
  console.log('server is created');
})

