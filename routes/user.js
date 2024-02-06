const express = require("express")
const user_route = express();
const path = require('path');
const session = require("express-session");
const nocache = require("nocache");



const userController = require("../api/services/user-controllers");
const profilecontrollers = require('../api/services/profile-controllers')


const userAuth = require('../middleware/userauth');

user_route.get('/',userController.home)
//signup route
user_route.get('/signup',userController.signup)
user_route.post('/signup',userController.signup_post)
user_route.post('/otp-signupValidation',userController.signup_Otpvalidation)


//login route
user_route.get('/login',userController.login)
user_route.post('/login',userController.login_post)
 user_route.post('/otp-loginValidation',userController.login_OTPValidation)

//resend otp
user_route.get('/resendOtp',userController.resendOtp)


// forgot password
user_route.get('/forgotPassword',userController.forGotPassword)
user_route.post('/numberValidation',userController.numberValidation)
user_route.post('/newPassword',userController.newPassword)
user_route.post('/resetPassword',userController.resetPassword)

//logout
user_route.get('/logout',userController.signout)




user_route.get('/shop',userController.shop)
user_route.post('/filter', userController.filter)
 
// successtic
user_route.get('/success',userController.successTick)

//product view 
user_route.get('/product-view/:id',userController.productView)

//product search
user_route.post('/search',userController.search_product)

// Add to cart  
user_route.get('/cart',userController.loadcart)
user_route.post('/cart/:id',userController.Addcart) 
user_route.post('/cart/quantityUpdate/:itemId', userController.cartQuantityUpdate); 
user_route.post('/cartDelete/:id',userController.cartDelete);


//wishlist
user_route.get('/wishlist',userController.WhishListLoad) 
user_route.post('/wishlist/:id',userController.addingWhishList)
user_route.get('/wishlist/:id',userController.WhishProductDelete)
user_route.post('/wishlist/cart:id',userAuth.isblock,userController.addingWhishListtoCart)

//cancel single product in checkout page
user_route.get('/cancelSingleProduct/:id',userController.cancelSingleProduct)

// checkout 
user_route.get('/CheckOutPage',userAuth.isblock,userController.Checkout)
user_route.post('/AddressUpdate',userAuth.isblock,userController.addressAdding)
user_route.post('/CheckOut',userAuth.isblock,userController.orderSuccess)
user_route.post('/saveOrderData',userController.savingData)

//coupen validation 

user_route.get('/profile',userAuth.isblock,profilecontrollers.profile)
user_route.get('/profile/order',userAuth.isblock,profilecontrollers.order)   
user_route.get('/profile/orderReturn',userAuth.isblock,profilecontrollers.listReturn)
user_route.post('/profile/order/:id',userAuth.isblock,profilecontrollers.orderCancel)
user_route.post('/profile/orderStatus/:id',userAuth.isblock,profilecontrollers.orderStatus)
user_route.post('/profile/orderReturn/:id',userAuth.isblock,profilecontrollers.orderReturn)
user_route.get('/profile/invoice',userAuth.isblock,profilecontrollers.pdf)
user_route.get('/profile/orderView',userAuth.isblock,profilecontrollers.orderView)
user_route.get('/profile/address',userAuth.isblock,profilecontrollers.profileAddress)
user_route.post('/profile/address/editAddress',userAuth.isblock,profilecontrollers.editAddress)
user_route.post('/profile/address/updateAddress',userAuth.isblock,profilecontrollers.updateaddress)
user_route.post('/profileUpdate',userAuth.isblock,profilecontrollers.profileUpdate)

//usser wallet
user_route.get('/profile/wallet',userAuth.isblock,profilecontrollers.loadWallet)
user_route.post('/profile/topup',userAuth.isblock,profilecontrollers.topUpWallet)
user_route.post('/profile/verify-topup',userAuth.isblock,profilecontrollers.verifyTopUp)
user_route.get('/profile/wallet_history',userAuth.isblock,profilecontrollers.loadWalletHistory)

module.exports = user_route


