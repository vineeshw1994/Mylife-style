// const express = require('express');
const admincollection = require('../../models/adminmodel');
const userCollection = require('../../models/usermodel');
const categorycollection = require('../../models/categorymodel');
const productCollection = require('../../models/productmodel');
const ordercollection = require('../../models/order')
const coupencollection = require('../../models/coupon')
const bannrcollection = require('../../models/banners')
const session = require("express-session");
const multer = require('multer');
const path = require('path')
const util = require('util');
const fs = require('fs')




const dashboard = async(req,res)=>{
    try{
        if(req.session.admin){
            const userData = await userCollection.find()
            const order = await ordercollection.find();
            const orderPdf = await ordercollection.find({}, { _id: 1, status: 1, payment: 1 })
            //console.log("orderPdf>>",orderPdf)
            const product = await productCollection.find()
            const orderDeliverd = order.filter((data) => data.status === "Delivered");
            const totalAmount = orderDeliverd.reduce((total, product) => total + parseInt(product.payment.amount), 0);
            const totalSales = orderDeliverd.length;
            console.log(totalSales)
            const totalUser = userData.length;
            console.log(totalUser)
            const totalOrder = order.length;
            console.log(totalOrder)
            const totalProduct = product.length;
            console.log(totalProduct)
            const orderCanceled = order.filter((data) => data.status === "Canceled");
            const canceled = orderCanceled.length;
            const orderStatus = {};
            // Retrieve all unique status values from the database
            const uniqueStatusValues = [...new Set(order.map((data) => data.status))];
            // Initialize the orderStatus object with the status values
            uniqueStatusValues.forEach((status) => {
                orderStatus[status] = 0;
            });
            // Count the occurrences of each status
            order.forEach((data) => {
                orderStatus[data.status]++;
            });

            const cata = await categorycollection.find();
            const method = await ordercollection.find();

            const admin = false
            res.render('admin/dashboard',{admin, totalSales,
                totalAmount: totalAmount,
                totalUser,
                canceled,
                totalOrder,
                order,
                orderPdf,
                totalProduct,   
                cata,
                method,
                orderStatus: JSON.stringify(orderStatus),})
        }else{
            const admin = true
            res.render('admin/adminlogin',{admin,errmsg: 'please Login',})
        }
    }catch(error){
        console.log(error.message);
    }
}

const graph = async (req, res) => {
    try {
      console.log("req.body",req.body);
     const { categoryname, salesRe, year, month, today } = req.body;
      
       let data 
      if(req.body.salesRe == "Yearly") {
          const targetYear = parseInt(req.body.year)
         
          data = await ordercollection.aggregate([
              {
                $match: {
                  //status: { $in: ["Delivered", "Returned", "Cancelled","Processing"] },
                  // Add your matching conditions here
                  createdAt: {
                    $gte: new Date(targetYear, 0, 1),
                    $lt: new Date(targetYear + 1, 0, 1)
                  }
                }
              },
              {
                $group: {
                  _id: "$status", // Group by status
                  count: { $sum: 1 } // Count occurrences of each status
                }
              },
              {
                $project: {
                  _id: 0, // Exclude _id field
                  label: "$_id", // Create a 'label' field with status value
                  value: "$count" // Create a 'value' field with count value
                }
              }
            ]);
            
          console.log("allOrder>>",data);
          res.json(data);
      }
      else if(req.body.salesRe ==='Monthly' )
      {
          const [targetYear, targetMonth] = month.split("-");
        
        const data = await ordercollection.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(targetYear, targetMonth - 1, 1),
                $lt: new Date(targetYear, targetMonth, 1)
              }
            }
          },
          {
            $group: {
              _id: "$status", // Group by status
              count: { $sum: 1 } // Count occurrences of each status
            }
          },
          {
            $project: {
              _id: 0, // Exclude _id field
              label: "$_id", // Create a 'label' field with status value
              value: "$count" // Create a 'value' field with count value
            }
          }
        ]);
  
        console.log("data>>", data);
        res.json(data);
      }
      else if(req.body.salesRe ==='Daily')
      {
          data = await ordercollection.aggregate([
              {
                $match: {
                  // Add your matching conditions here
                  createdAt: {
                    $gte: new Date(today), // Start of the given date
                    $lt: new Date(today + 'T23:59:59.999Z') // End of the given date
                  }
                }
              },
              {
                $group: {
                  _id: "$status", // Group by status
                  count: { $sum: 1 } // Count occurrences of each status
                }
              },
              {
                $project: {
                  _id: 0, // Exclude _id field
                  label: "$_id", // Create a 'label' field with status value
                  value: "$count" // Create a 'value' field with count value
                }
              }
            ]);
            console.log("data>>",data);
            res.json(data)
      }
     else{
      data={}
      res.json(data);
     }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  const graphcategory = async (req, res) => {
    console.log("hai");
    const categoryName = req.body.category;
  
    try {
      // Fetch and aggregate data based on the selected category
      const data = await ordercollection.aggregate([
        {
          $match: {
            'payment.method': categoryName,
          },
        },
        {
          $group: {
            _id: '$payment.method', // Group by payment method
            totalAmount: { $sum: { $toInt: '$payment.amount' } }, // Calculate total payment amount
            count: { $sum: 1 }, // Calculate the count of orders
          },
        },
        {
          $project: {
            _id: 0,
            label: '$_id', // Use payment method as the label
            totalAmount: 1,
            count: 1,
          },
        },
      ]);
  
      console.log("data>> this is the payments methods datas", data);
      res.json(data); // Send the data as a JSON response
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
  };
  

  const salesReportPdf = async (req, res) => {
    try {
        console.log(' i am the pdf downloader')
      // Fetch orders from the database
      const order = await ordercollection.find();
    //   console.log("order",order)
  
      // Create the data for the PDF invoice
      const invoiceOptions = {
        currency: 'USD',
        taxNotation: 'vat',
        marginTop: 25,
        marginRight: 25,
        marginLeft: 25,
        marginBottom: 25,
        header: {
            text: 'Sales Report', // Change the text here
            alignment: 'right', // Adjust alignment as needed
          },
        // logo: 'https://www.example.com/logo.png', // Your logo URL
        //background: 'https://www.example.com/background.png', // Background image URL
        sender: {
          company: 'E-Shop',
          address: 'Kazhakoottum',
          zip: '629 163',
          city: 'Trivandrum',
          country: 'Kerala',
          phone: '7598570568',
        },
        client: {
          company: ' ',
          address: ' ',
          zip: ' ',
          city: ' ',
          country: ' ',
          phone: ' ',
        },
        information: {
            invoiceNumber: 'INV-12345',
            invoiceDate: new Date().toISOString().slice(0, 10), // Current date in YYYY-MM-DD format
            product: [],
            bottomNotice: 'Thank you for your business!',
        },
          products: [],
    
          bottomNotice: 'Discount: $10',
          subtotal: 185,
          total: 175,
        };
    order.forEach((data) => {
        if (data.products && data.products.length > 0) {
          data.products.forEach((product) => {
            invoiceOptions.products.push({
              quantity: product.quantity,
              description: product.name, // Include product description or name
              price: product.price, // Include product price
            });
          });
        }
      });

      console.log('this is my order detials',order)
      
      const result = await easyinvoice.createInvoice(invoiceOptions);
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Report.pdf');
    res.send(pdfBuffer);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error: ');
    }
  };

  
const salesReport=async(req,res)=>{

    
    try {
        
        const order = await ordercollection.aggregate([
            {
                $unwind: '$products' // Unwind the products array
            },
            {
                $group: {
                    orderId:{$first:'$_id'},
                    _id: {
                        name: '$products.name',
                        price: '$products.realPrice',
                        category:'$products.category'
                    },
                    payment: { $first: '$payment.method' },
                    status: { $first: '$status' },
                    count: { $sum: 1 } // Count the number of occurrences
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the _id field
                    name: '$_id.name',
                    price: '$_id.price',
                    payment: 1,
                    status: 1,
                    orderId:{$toString:'$orderId'},
                    count: 1
                }
            }
        ]);
        
          res.render('admin/salesReport',{ title: " ", order, admin: req.session.admin, message: "" });
        }

    
     catch (error) {
        console.log(error)
    }
}
 


const login = (req, res) => {
    try {
        if (req.session.admin) {
            res.redirect('admin/dashboard')
        } else {
            let admin = true
            res.render('admin/adminlogin', { admin })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const login_post = async (req, res) => {
    const email = 'admin@gmail.com'
    const password = 12345
    const admindata = req.body
    //console.log(admindata); 
    if (email == admindata.email && password == admindata.password) {
        let admin = false
        req.session.admin = admindata.email
        const data = await categorycollection.find()
        res.redirect('/admin/dashboard')
    } else {
        let admin = true
        res.render('admin/adminlogin', { msg: 'Invalid login credentials', admin })
    }

}

const adminLogout = async (req, res) => {
    try {
        req.session.admin = null;
        res.render('admin/adminlogin', { title: "Admin Login", admin: req.session.admin })
    } catch (error) {
        console.log(error)
    }
}


//users block 
const users = async (req, res) => {
    try {
        if (req.session.admin) {
            let admin = false
            const userdata = await userCollection.find()
            res.render('admin/users', { user: false, userdata, admin })
        } else {
            let admin = true
            res.render('admin/adminlogin', { admin, errmsg: 'please Login' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const user_search = async (req, res) => {
    const search = req.body.search
    const userdata = await userCollection.find({ name: { $regex: '^' + search,$options: 'i'} })
    //console.log(userdata);
    if (userdata === '') {
        let admin = false
        res.render('admin/users', { userdata, admin, nodata: 'Searching name is not available' })
    } else {
        let admin = false
        res.render('admin/users', { userdata, admin })
    }
}
const search_product = async(req,res)=>{
    try{
        const search = req.body.search
        console.log(search);
    const product = await productCollection.find({$and:[{name:{$regex: '^' + search,$options: 'i'}},{softdelete:true}]})
        console.log(product);
        let admin = false;
        let nodataMessage = '';
       
        if (product.length === 0) {
          nodataMessage = 'No data available';
          res.render('admin/viewproducts', { product, admin, nodata: nodataMessage });
        }else {
            let admin = false
            res.render('admin/viewproducts', { product, admin })
        }
    }catch(err){
        console.log(err.message);
    }
    
}

const userblocking = async (req, res) => {
    try {
        const userId = req.query.id
        //console.log('hello');
        //console.log(userId);
        await userCollection.updateOne({ _id: userId}, {
            $set: {
                isblocked: true
            }
 
        })
        res.redirect('/admin/users')
    }
    catch (err) {
        console.log(err)
    }

}

const userUnBlocking = async (req, res) => {
    try {
        const userId = req.query.id
        await userCollection.updateOne({ _id: userId }, {
            $set: {
                isblocked: false
            }
        })
        res.redirect('/admin/users')
    }
    catch (err) {
        console.log(err)
    }

}


//category block
const category = async (req, res) => {
    try {
        if (req.session.admin) {
            let admin = false
            const data = await categorycollection.find()
            res.render('admin/category', { data, admin })
        } else {
            let admin = true
            res.render('admin/adminlogin', { admin, errmsg: 'please Login' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const create_category = (req, res) => {
    try {
        if(req.session.admin){
            const admin = false
            res.render('admin/category-create',{admin})
        }else{
            const admin = true
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error)
    } 
 
} 
const create_category_post = async (req, res) => {
   try {
        const { categoryName, discription, isAvailable } = req.body; // Destructuring all required fields
        console.log(categoryName);

        const category = await categorycollection.findOne({ categoryName: categoryName });

        if (!category) {
            const admin = false;
            const data = {
                categoryName: categoryName.trim(),
                categoryDescription: discription.trim(), 
                isavilable: isAvailable
            };
            await categorycollection.insertMany(data); 
            res.render('admin/category-create', { msg: 'Category added successfully', admin });
        } else {
            const admin = false;
            res.render('admin/category-create', { errmsg: 'Category already exists', admin });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error'); // Sending an error response to the client
    }
const edit_categories = async (req, res) => {
    try {
        const id = req.query.id
        const list = await categorycollection.findOne({ _id: id })
        //console.log(list);
        res.render('admin/category-edit', { list,admin:true})
    } catch (err) {
        console.log(err.message);
    }
}

const unlistCategory = async (req, res) => {
    try {
        const categoryId = req.params.id
        await categorycollection.findByIdAndUpdate({ _id: categoryId },
            {
                $set: { isavilable: false }
            })

        res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }

}

const listCategory = async (req, res) => {
    try {
        const categoryId = req.params.id
        await categorycollection.findByIdAndUpdate({ _id: categoryId },
            {
                $set: { isavilable: true }
            })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }

}

const categoryEditpost = async (req, res) => {
    try {

        await categorycollection.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                categoryName: req.body.categoryName,
                categoryDescription: req.body.description,
                isavailable: req.body.isavailable,
            }
        })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error)
    }
}
// const delete_category = async (req, res) => {
//     const id = req.query.id
//     //console.log(id);
//     await categorycollection.deleteOne({ _id: id })
//     res.redirect('/admin/category')
// }


//product block
const productsPerPage = 5;
const products = async (req, res) => { 
    console.log(req.url);
    try {
      if (req.session.admin) {
        let admin = false;
        const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
  
        const skip = (page - 1 )* productsPerPage;
        
  
        const totalProducts = await productCollection.find({ softdelete: { $ne: false } }).count()
        console.log(totalProducts);
        const totalPages = Math.ceil(totalProducts / productsPerPage);
  
        const product = await productCollection
          .find({ softdelete: { $ne: false } })
          // .sort({name:1})
          .skip(skip)
          .limit(productsPerPage) 
              
  
        res.render('admin/viewproducts', {
          product,
          admin,
          totalPages,
          currentPage: page,
        });
      } else {
        let admin = true;
        res.render('admin/adminlogin', { admin, errmsg: 'please Login' });
      }
    } catch (error) {
      console.log(error.message);
    }
}
const add_product = async(req, res) => {
    try {
        const cateData = await categorycollection.find({},{categoryName:1
        })
        //console.log(cateData);
        res.render('admin/add-products', {cateData, msg: '',admin:false })
    } catch (error) {
        console.log(error.message);
    }
}

const add_product_post = async (req, res, next) => {
    try {
         console.log("hi i am ")
         const files = req.files
         const originalprice = parseInt(req.body.originalprice);
         const productOffer = parseInt(req.body.offers);
         console.log(req.body)
         console.log(productOffer)
         const updatingPrice = originalprice-((originalprice*productOffer)/100);
         console.log(updatingPrice);
        //console.log(req.body); 
        const product = {
            name: req.body.name,
            price: updatingPrice,
            originalprice:req.body.originalprice,
            productOffer:req.body.offers,
            quantity:req.body.quantity,
            discription: req.body.discription.trim(),
            category:req.body.category.trim(),
            image:files.map(file => file.filename)
        }

        await productCollection.insertMany([product])
        res.redirect('/admin/view-product')
        //console.log('image upload successfully ');

    } catch (error) {
        console.log(error.message);
    }
}
 

const edit_product = async (req,res)=>{
  try{
    const id = req.params.id
    const productData = await productCollection.findOne({_id:id})
    res.render('admin/edit-product',{productData, admin:false})
   }catch(error){
    console.log(error.message);
    res.status(500).send("Internal error")
   }
} 

const editproduct_post = async(req,res)=>{

    try {
        const id = req.body.id;
       console.log(req.body);
        // Retrieve existing product data
        const existingProduct = await productCollection.findById(id);
         // Check if the product with the specified ID exists
         if (!existingProduct) {
            return res.status(404).send("Product not found");
        }
        console.log(existingProduct);
        const existingImages = existingProduct.image;

        //adding the discount
        const originalprice = parseInt(req.body.price);
         const productOffer = parseInt(req.body.Offer);
         const updatingPrice = originalprice-((originalprice*productOffer)/100);

            // console.log("Original Price:", originalprice);
            // console.log("Product Offer:", productOffer);
            // console.log("Updating Price:", updatingPrice);

      

        // Get the list of images to delete based on checkbox values
        const imagesToDelete = req.body.imagesToDelete || [];

        // Delete images that are not selected (checkbox not ticked)
        const imagesToKeep = existingImages.filter((image) => !imagesToDelete.includes(image));
        // console.log(imagesToDelete);
        // console.log(imagesToKeep);
        // Delete previous images from fs
        existingImages.forEach((filename) => {
            if (!imagesToKeep.includes(filename)) {
                fs.unlink(`productImages/${filename}`, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });


        
        const updatedData = {
            name: req.body.name,
            price: updatingPrice,
            originalprice:req.body.price,
            productOffer: req.body.Offer,
            discription: req.body.discription,
            category: req.body.category,
            quantity: req.body.quantity,
            image: imagesToKeep, // Set the updated image list
        };

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => file.filename);
            updatedData.image = updatedData.image.concat(newImages); // Add new images
        }

        await productCollection.findByIdAndUpdate(id, updatedData);
        res.redirect('/admin/view-product');
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal error");
    }
}

const productDelete = async (req, res) => {
    try {
        const id = req.params.id;
        const existingProduct = await productCollection.findById(id);
        const existingImages = existingProduct.image;
        // Delete previous images from fs
        existingImages.forEach((filename) => {
            fs.unlink(`productImages/${filename}`, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });
        await productCollection.findByIdAndDelete({ _id: id })
        res.redirect('/admin/view-product');
    } catch (error) {
        console.log(error)
    }
}

const prodUnlist = async (req, res) => {
    try {
        const prod_Id = req.params.id
        await productCollection.findByIdAndUpdate({ _id: prod_Id }, {
            $set: {
                availability: false
            }
        })
        res.redirect('/admin/view-product')
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const prodlist = async (req, res) => {
    try {
        const prod_Id = req.params.id
        await productCollection.findByIdAndUpdate({ _id: prod_Id }, {
            $set: {
                availability: true
            }
        })
        res.redirect('/admin/view-product')
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

//orders
const orderList = async (req, res) => {
    console.log(' i am the order listing');
    try {
       if(req.session.admin){ 
        // const admin = req.session.admin;
        const admin = false
        const orderList = await ordercollection.find();
        //console.log(orderList)
        const user = orderList.map(item => item.userId);
        const userData = await userCollection.find({ _id: { $in: user } });
       // console.log('hello man i am inside')
        //console.log(userData)
        const ordersWithData = orderList.map(order => {
           // console.log(' man its fear')
            const user = userData.find(user => user._id.toString() === order.userId.toString());
            return {
                ...order.toObject(),
                user: user
            };
        });
        const ordersWithDataSorted = ordersWithData.sort((a, b) => b.createdAt - a.createdAt);
        // console.log('what happened actually')
        // console.log(ordersWithDataSorted)
        res.render('admin/orders', { admin, orderList: ordersWithDataSorted })
       }else{
        res.redirect('/admin/login')
       }
    } catch (error) {
        console.log(error)
    } 
}

const orderstatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const status = req.body.status;
        await ordercollection.findByIdAndUpdate({ _id: orderId }, {
            $set: {
                status: status
            }
        })
        res.json(status);
    } catch (error) {
        console.log("error in the orderstatus updation");
        res.json("error in the orderstatus updation");
    }
}


const orderDetails = async (req, res) => {
    try {
        const admin = false;
        const userId = req.body.userId;
        const orderId = req.body.orderId;
        const userDetails = await userCollection.findOne({ _id: userId });
        const order = await ordercollection.find({ _id: orderId });
        const orderProducts = order.map(items => items.proCartDetail).flat();
        const cartProducts = order.map(items => items.cartProduct).flat();
        for (let i = 0; i < orderProducts.length; i++) {
            const orderProductId = orderProducts[i]._id;
            const matchingCartProduct = cartProducts.find(cartProduct => cartProduct.productId.toString() === orderProductId.toString());

            if (matchingCartProduct) {
                orderProducts[i].cartProduct = matchingCartProduct;
            }
        }
        const address = userDetails.address.find(items => items._id.toString() == order.map(items => items.address).toString());
        const subTotal = cartProducts.reduce((totals, items) => totals + items.price, 0);
        const [orderCanceld] = order.map(item => item.orderCancleRequest);
        const orderStatus = order.map(item => item.status);
        res.render("admin/orderDetails", { admin, order, orderProducts, subTotal, address, orderCanceld, orderStatus, userDetails });
    } catch (error) {
        console.log(error + "orderdetailing error")
    }
}

const orderAccept = async (req, res)=>{
    try {
        console.log('i am the order accepter')
        const orderId = req.params.id;
        console.log(orderId)
        // const order = await ordercollection.findOne({ _id: orderId })
        await ordercollection.findByIdAndUpdate({ _id: orderId }, {
            $set: {
                status: 'Return Accepted'
            }
        })
        res.redirect("/admin/order");
    } catch (error) {
        console.log("error in the orderstatus updation");
        res.json("error in the orderstatus updation");
    } 
}

const orderReject = async (req, res)=>{
    try {
        console.log('i am the order rejecter')
        const orderId = req.params.id;
        console.log(orderId)
        // const order = await ordercollection.findOne({ _id: orderId }
        await ordercollection.findByIdAndUpdate({ _id: orderId }, { 
            $set: {
                status: 'Canceled'
            }
        })
        res.redirect("/admin/order");
    } catch (error) {
        console.log("error in the orderstatus updation");
        // res.json("error in the orderstatus updation");
    }
}

//coupen

const couponsList = async (req, res) => {
    try {
       if(req.session.admin){
        const admin = false
        const couponData = await coupencollection.find();
        res.render('admin/coupen', { admin, couponData, couponData })
       }else{
        res.redirect('/admin/login')
       }

    } catch (error) {
        console.log(error);
        res.status(500).send("couponRendering Error");
    }
}

const couponsAdding = async (req, res) => {
    try {
        const admin = false
        res.render('admin/add-coupen', { admin });
    } catch (error) {
        console.log("couponAddingPage Rendering Error");
        res.status(500).send("couponAddingPage Rendering Error");
    }
}

const couponCreation = async (req, res) => {
    try {
        const data = req.body;
        const couponDetails = new coupencollection({
            couponName: data.couponName,
            couponValue: data.couponValue,
            expiryDate: data.expiryDate,
            maxValue: data.maxValue,
            minValue: data.minValue
        })
        await couponDetails.save();
        res.redirect('/admin/coupons');
    } catch (error) {
        res.status(500).render('admin/coupon', { message: "Coupon Already Existing....", admin: req.session.admin });
    }
}

const couponsRemove = async (req, res) => {
    try {
        const couponId = req.params.id;
        await coupencollection.findByIdAndDelete(couponId)
        res.json("successfully removed");
    } catch (error) {
        res.status(500).json("error by the server side");
    }
}

//banner
 
const banner = async(req,res)=>{
    try{
        if(req.session.admin){
        const bannerData = await bannrcollection.find()
        res.render('admin/banners',{admin:false,bannerData}) 
    }else{
        res.redirect('/admin/login')
       }

    }catch(error){
        console.log(error.msg)
        res.status(500).send("bannerRendering Error");
    }  
}
 
const add_banner = (req,res)=>{
    try {
        const admin = false
        res.render('admin/add-banner', {admin});
    } catch (error) {
        console.log("bannerAddingPage Rendering Error");
        res.status(500).send("bannerAddingPage Rendering Error");
    }
}

const add_bannerPost = async(req,res)=>{
    console.log('i am the add banner')
    const files = req.files
    const {name,discription} = req.body;
    console.log(name,discription,files)

    const banner = { 
        name:name,
        description:discription,
        image:files.map(file => file.filename),
        availability:true
    }

      await bannrcollection.create(banner)
      res.redirect('/admin/banners')
}

const bannerRemove = async (req,res)=>{
    try {
        const bannerId = req.params.id;
        await bannrcollection.findByIdAndDelete(bannerId)
        // res.json("successfully removed");
        res.redirect('/admin/banners')
    } catch (error) {
        res.status(500).json("error by the server side");
    }
}

const bannerHide = async (req, res) => {
    try {
        const prod_Id = req.params.id
        await bannrcollection.findByIdAndUpdate({ _id: prod_Id }, {
            $set: {
                availability: false
            }
        })
        res.redirect('/admin/banners')
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const bannerUnHide = async (req, res) => {
    try {
        const prod_Id = req.params.id
        await bannrcollection.findByIdAndUpdate({ _id: prod_Id }, {
            $set: {
                availability: true
            }
        })
        res.redirect('/admin/banners')
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = {
    dashboard,
    graph,
    graphcategory,
    salesReport,
    salesReportPdf,
    login,
    products,
    users,
    category,
    add_product,
    add_product_post,
    productDelete,
    create_category,
    create_category_post,
    userblocking,
    userUnBlocking,
    edit_categories,
    categoryEditpost,
    user_search,
    unlistCategory,
    listCategory,
    login_post,
    adminLogout,
    prodUnlist,
    prodlist,
    edit_product,
    search_product,
    editproduct_post,
    orderList,
    orderDetails,
    orderstatus,
    couponsList,
    couponsAdding,
    couponsRemove,
    couponCreation,
    banner,
    add_banner,
    add_bannerPost,
    bannerRemove,
    bannerHide,
    bannerUnHide,
    orderAccept,
    orderReject,
}
