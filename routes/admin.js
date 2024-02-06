var express = require('express');
var admin_router = express.Router();
const session = require("express-session");
const nocache = require("nocache");
const multer =require('multer')

const admincontroller = require('../api/services/admin-controllers.js')

const adminauth = require('../middleware/adminauth');
const adminCollection = require('../models/adminmodel.js');


//multer 

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'productImages'); // Destination folder for uploaded images
//     },
//     filename: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       cb(null, uniqueSuffix + '-' + file.originalname); // Unique filename for each uploaded image
//     }
//   });
// const upload = multer({storage: storage});

//multer for the products images upload
const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/userProfile'); // Destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Unique filename for each uploaded image
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error(' Only JPG and PNG images are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });
  

//multer for the banner image upload

const banner = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'banner'); // Destination folder for uploaded images
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // Unique filename for each uploaded image
      }
    });
  const update = multer({storage: banner});
  



//dashboard

admin_router.get('/dashboard',admincontroller.dashboard)
admin_router.post('/dashboard/graph',admincontroller.graph) 
admin_router.post('/dashboard/graphcategory',admincontroller.graphcategory)
admin_router.get('/dashboard/salesReport',admincontroller.salesReport)
admin_router.post('/Pdf',admincontroller.salesReportPdf)



 


//admin login
admin_router.get('/login',adminauth.isAdmin, admincontroller.login)
admin_router.post('/login',admincontroller.login_post)
admin_router.get('/signout',admincontroller.adminLogout)

//product routes
admin_router.get('/view-product', admincontroller.products)
admin_router.get('/add-product', admincontroller.add_product)
admin_router.post('/add-product',upload.array('image'),admincontroller.add_product_post)
admin_router.get('/edit-product/:id',admincontroller.edit_product)
admin_router.post('/edit-product',upload.array('image'),admincontroller.editproduct_post)
admin_router.post('/product-search',admincontroller.search_product)
admin_router.get('/deleteProduct/:id',admincontroller.productDelete)
admin_router.post('/p_unlist/:id',admincontroller.prodUnlist)
admin_router.post('/p_list/:id',admincontroller.prodlist)

//users routes
admin_router.get('/users', admincontroller.users)
admin_router.post('/user-search',admincontroller.user_search)
admin_router.post('/user-blocking', admincontroller.userblocking)
admin_router.post('/user-unblocking', admincontroller.userUnBlocking)
 
//category routes     
admin_router.get('/category', admincontroller.category)
admin_router.get('/create-category', admincontroller.create_category)
admin_router.post('/create-category', admincontroller.create_category_post)
admin_router.get('/edit-category', admincontroller.edit_categories)
admin_router.post('/category-edit',admincontroller.categoryEditpost)
// admin_router.get('/delete-category',admincontroller.delete_category)
admin_router.post('/unlistCategory/:id',admincontroller.unlistCategory)
admin_router.post('/listCategory/:id',admincontroller.listCategory)

//order
admin_router.get('/order',admincontroller.orderList)
admin_router.put('/order/:id',admincontroller.orderstatus)
admin_router.post('/order/details',admincontroller.orderDetails)
admin_router.post('/order-accepct/:id',admincontroller.orderAccept)
admin_router.post('/order-cancel/:id',admincontroller.orderReject)

//coupen
admin_router.get('/coupons',admincontroller.couponsList)
admin_router.get('/coupons/couponsAdding',admincontroller.couponsAdding)
admin_router.post('/coupons/couponsAdding',admincontroller.couponCreation)
admin_router.post('/coupons/couponsRemove/:id',admincontroller.couponsRemove)

//banners

admin_router.get('/banners',admincontroller.banner)
admin_router.get('/add-banner',admincontroller.add_banner)
admin_router.post('/banners',update.array('image'),admincontroller.add_bannerPost)
admin_router.post('/bannerRemove/:id',admincontroller.bannerRemove)
admin_router.post('/b_unlist/:id',admincontroller.bannerHide)
admin_router.post('/b_list/:id',admincontroller.bannerUnHide)





module.exports = admin_router
