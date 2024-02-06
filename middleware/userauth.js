const userCollection = require("../models/usermodel");
const productModel = require('../models/productmodel')
const userController = require("../api/services/user-controllers");


const isLogin = async (req, res, next) => {
    try {
      if (req.session.user) {
        next();
      } else {
        const user = req.session.user;
        const data = await productModel.find();
        const mobiles = await productModel.find({category:'Smart Watch'}, {})
        if(req.session.user){
          enter = false
      } else{
          enter = true
      }
        res.render('user/home',{data,enter,mobiles,user})
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.user) {
        res.redirect("/");
      } 
      else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const isblock = async (req,res,next) => {
    try{
      console.log('isblocked is actually worked');
      if(req.session.user){
        console.log('man is worked ');
        // const email = req.body.email
        const email = req.session.user
        const check = await userCollection.findOne({ email:email });
        if(check.isblocked === false){
          next();
      }else{
         req.session.user = null
          res.render('user/login',{user,message:"Please contact Your Admin You are no longer to access this account"})
        
      }
     
      }
     
    }catch(err){
      console.log(err.message);
    }
   
  }

  const userChecking = (req,res,next)=>{
    if(req.session.user){
      next()
    }else{
      res.redirect('/login')
    }
  }
  
  module.exports = {
    isLogin,
    isLogout,
    isblock,
    userChecking,
  };
  