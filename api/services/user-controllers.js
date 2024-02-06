const categoryCollection = require('../../models/categorymodel');
const productCollection = require('../../models/productmodel');
const usercollection = require('../../models/usermodel');
const otpcollection = require('../../models/otpmodel')
const couponcollection = require('../../models/coupon')
const ordercollection = require('../../models/order') 
const bannercollection = require('../../models/banners')
const Razorpay = require('razorpay')
const bcrypt = require('bcrypt'); 

const fast2sms = require('fast-two-sms');
const { order } = require('./profile-controllers');



const API = process.env.FAST_TWO_SMS_API
const key_id = process.env.key_id
const key_secret = process.env.key_secret



//PASSWORD ENCRIPTION

const pwdEncription = (password) => {
    const hasheNdPWD = bcrypt.hash(password, 10)
    return hasheNdPWD
}



const home = async (req, res) => {
    try {
        console.log('hello man i am the home page ');
        const products = await productCollection.find({ availability: true }).limit(10)
        const product = await productCollection.find({ availability: true }).skip(10).limit(10)
        const bannerData = await bannercollection.find({availability:true})
        // const mobiles = await productCollection.find({ category: 'Mobiles' },{})

        if (req.session.user) {
            const useremail = req.session.user
            console.log(useremail);
            const userdetials = await usercollection.findOne({ email: useremail })
            const name = userdetials.name;
            const whish_count = userdetials.wishlist.length
            console.log('hello this is count for whish list',whish_count);
            
            const cart = userdetials.cart.items
            const cartCount = cart.length
            const wishlist = userdetials.wishlist.length
            console.log('this is the wishlist count ', wishlist)
            user = true;
            res.render('user/home', { products, user, cartCount, name, product, whish_count,bannerData , wishlist})
        } else {
            console.log('this is home else condition')
            user = false;
            res.render('user/home', { user, products, product,bannerData});
        }


    } catch (error) {
        console.log(error.message);
        const message = error.message
        res.status(500).render('404-error', { error:500, message:'Internal Server Error' })
    }
}


const search_product = async (req, res) => {
    try {
        const search = req.body.search
        const products = await productCollection.find({ name: { $regex: '^' + search, $options: 'i' } })
        const category = await categoryCollection.find({ isavilable: true })


        if (products === null) {
            let user = false
            let res = 'product is not avilable'
            res.render('user/shop', { user, products, product: '', category })
        } else {
            const user = true
            res.render('user/shop', { user, products, product: '', category })
        }
    } catch (error) {
        console.log(error.message);
        const message = error.message
        res.render('404-error', {  error:500, message:'Internal Server Error' })

    }

}




const login = (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/')
        } else {
            res.render('user/login')
        }
    } catch (error) {
        console.log('error.message');
        const message = error.message
        res.render('404-error', {  error:500, message:'Internal Server Error' })
    }

}
const login_post = async (req, res) => {
        try {
            console.log(' i am the login post')
            console.log(req.body.Email)
            const userdata = await usercollection.findOne({ email: req.body.Email });
            console.log(userdata)
            if (userdata === null) {
                res.render('user/login', { errmsg: 'user credentials invalid' });
            } else {
                isvalid = userdata.isblocked;
                if (isvalid === true) {
                    res.render('user/login', { blockmsg: 'Please Contact Your Admin You are not Allow to Use this Account AnyMore' });
                } else {

                    const vpsw = await bcrypt.compare(req.body.Password, userdata.password);
                    if (userdata.email === req.body.Email && vpsw === true) {
                        const usernumber = userdata.mobile;
                        const number = usernumber;
                        let cartCount;
                        let entrie = 0;

                      
                        req.session.data = userdata.email;


                        //   otp generator
                        let randome = Math.floor(Math.random() * 9000) + 1000;
                        console.log(randome);
                        //sms sending to the user 

                        fast2sms.sendMessage({
                            authorization: API,
                            message: `Your verification OTP is: ${randome}`,
                            numbers: [number],
                        })
                            .then(saveUser());

                        //save randome Number to database then render verify page
                        function saveUser() {
                            const newUser = new otpcollection({
                                number: randome
                            })
                            newUser.save()
                                .then(() => {
                                    res.render('user/validation', { user: req.session.user, cartCount, entrie });
                                })
                                .catch((error) => {
                                    console.log("error generating numb", error);
                                });
                        }



                    } else {
                        console.log(' i am the login post error')
                        const cart = userdata.cart.items;
                        const cartCount = cart.length;
                        res.render('user/login', { errmsg: 'Check your password' })
                    }
                }
            }
        } catch (error) {
            console.log(error.message);
            const message = error.message
            res.render('404-error', { error:500, message:'Internal Server Error' })

        }
    }

const login_OTPValidation = async (req, res) => {
    let cartCount;
    try {
        const num1 = req.body.num_1;
        const num2 = req.body.num_2;
        const num3 = req.body.num_3;
        const num4 = req.body.num_4;
        const code = parseInt(num1 + num2 + num3 + num4);
        const userEmail = req.session.data;
        await otpcollection.find({ number: code })
            .then((fount) => {
                if (fount.length > 0) {
                    req.session.user = userEmail;
                    const succ = "Successfully Logged In"
                    let cartCount;
                    res.render("user/successtic", { user: req.session.user, cartCount, succ });
                    // IF FOUND, DELETE THE OTP CODE FROM DB
                    otpcollection.findOneAndDelete({ number: code })
                        .then(() => {
                            console.log("successfully deleted")
                        })
                        .catch((err) => {
                            console.log("error while deleting", err);
                        });
                } else {
                    const entrie = 0;
                    res.render('user/validation', { fail: "Please Check Your OTP", user: req.session.user, entrie })
                }
            })
            .catch((err) => {
                res.render('user/validation', { fal: "Please Check Your OTP", user: req.session.user, cartCount })
            })
    } catch (error) {
        console.log(error)
        res.status(500).send("Otp error")
        const message = error.message
        res.status(500).render('404-error', { error:500, message:'Internal Server Error' })
    }
}

//forgot password
const forGotPassword = async (req, res) => {
    try {
        let cartCount;
        res.render("user/forgotPassword", { user: req.session.user, cartCount })
    } catch (error) {
        console.log(error);
        const message = error.message
        res.render('404-error', { error:500, message:'Internal Server Error' })

    }
}

const numberValidation = async (req, res) => {
    try {
        const number = req.body.number;
        console.log(number)
        req.session.userNumber = number;
        const entrie = 2;
        let cartCount;
        const userExist = await usercollection.findOne({ mobile: number });
        console.log('i am number validation ')
        console.log(userExist)
        if (userExist) {
            console.log(' hi i am the user exist')
            const randome = Math.floor(Math.random() * 9000) + 1000;
            console.log(randome)
            fast2sms.sendMessage({
                authorization: API,
                message: `Your verification OTP is: ${randome}`,
                numbers: [number],
            })
                .then(saveUser());
            //save randome Number to database then render verify page
            function saveUser() {
                const newUser = new otpcollection({
                    number: randome
                })
                newUser.save()
                    .then(() => {
                        res.render('user/validation', { user: req.session.user, cartCount, entrie });
                    })
                    .catch((error) => {
                        console.log("error generating numb", error);
                    });
            }
        } else {
            const msg = "Please Enter The Currect Number";
            let cartCount;
            res.render("user/forgotPassword", { user: req.session.user, msg, cartCount })
        }
    } catch (error) {
        const msg = "Server Error Wait for the Admin Response";
        let cartCount;
        console.log("error At the number validation inreset place" + error);
        res.status(500).render("user/forgotPassword", { user: req.session.user, msg, cartCount })
    }
}


const newPassword = async (req, res) => {
    try {
        console.log('this is the new password ', req.body.password, req.session.userNumber);
        const psw = req.body.password;
        const userNumber = req.session.userNumber;

        const newPassword = await pwdEncription(psw); // Assuming pwdEncription is a correct function
        console.log('Encrypted Password:', newPassword);

        const newpass = await usercollection.findOneAndUpdate({ mobile: userNumber }, {
            $set: {
                password: newPassword
            }
        });

        console.log('Updated Password:', newpass);

        if (!newpass) {
            throw new Error('Password update failed!');
        }

        req.session.userNumber = null;
        const succ = "Successfully Changed Your Password";
        let cartCount;
        res.render("user/successtic", { user: req.session.user, cartCount, succ });
    } catch (error) {
        console.log(error);
        const message = error.message || 'Internal Server Error';
        res.render('404-error', { error: 500, message });
    }
}

// reset password
const resetPassword = async (req, res) => {
    try {
        const num1 = req.body.num_1;
        const num2 = req.body.num_2;
        const num3 = req.body.num_3;
        const num4 = req.body.num_4;
        const code = parseInt(num1 + num2 + num3 + num4);
        const entrie = 2;
        let cartCount;
        await otpcollection.find({ number: code })
            .then((fount) => {
                if (fount.length > 0) {
                    res.render("user/resetPassword", { user: req.session.user, cartCount })
                    // IF FOUND, DELETE THE OTP CODE FROM DB
                    otpcollection.findOneAndDelete({ number: code })
                        .then(() => {
                            console.log("successfully deleted")
                        })
                        .catch((err) => {
                            console.log("error while deleting", err);
                        });
                } else {
                    let cartCount;
                    res.render('user/validation', { fal: "Please Check Your OTP", user: req.session.user, cartCount, entrie })
                }
            })
            .catch((err) => {
                console.log(err);
                res.render('user/validation', { fal: "Please Check Your OTP", user: req.session.user, cartCount, entrie })
            })
    } catch (error) {
        console.log("reset password error" + error);
        const message = error.message
        res.render('404-error', {  error:500, message:'Internal Server Error' })

    }
}


const signup = (req, res) => {
    try {
        if(req.session.user){
            res.redirect('/')
        }else{
            res.render('user/signup',{success:'',succ:'',exist:''})
        }
    } catch (error) {
        console.log(error.message);
        const message = error.message
        res.render('404-error', {error:500, message:'Internal Server Error'})
    }
} 
const signup_post = async (req, res) => {
    try {
        const entrie = 1;
        const enpwd = await pwdEncription(req.body.password);
        req.body.password = enpwd;
        req.body.isblocked = false
        let cartCount;
        const { name, email, mobile, password, isblocked } = req.body
        req.session.userData = {
            name: name,
            email: email,
            mobile: mobile,
            password: password,
            isblocked: isblocked,
        }

        //console.log(req.session.userData)

        const checkname = await usercollection.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.mobile }] })

        console.log(checkname)

        if (!checkname) {
            const randome = Math.floor(Math.random() * 9000) + 1000;
            
            console.log(randome)
            fast2sms.sendMessage({
                authorization: API,
                message: `Your verification OTP is: ${randome}`,
                numbers: [mobile],
            })
                .then(saveUser());             //save randome Number to database then render verify page
            function saveUser() {
                const newUser = new otpcollection({
                    number: randome
                })
                newUser.save()
                    .then(() => {
                        res.render('user/validation', { user: req.session.user, cartCount, entrie });
                    })
                    .catch((error) => {
                        console.log("error generating numb", error);
                    });
            }

            // await usercollection.insertMany([userdata])
            // req.session.user = req.body.email
            // res.redirect('/')


        } else {
            const user = true
            res.render('user/signup', { exist: 'email or mobile already exist', user })
        }

    } catch (error) {
        console.log(error.message);
        let cartCount;
        // res.render('user/signUp', { succ: "Please Use a Uniqe Email ID and Phone Number", user: req.session.user, cartCount })
        const message = error.message
        res.render('404-error', {error:500, message:'Internal Server Error'})
    }
}

//signup otp validation
const signup_Otpvalidation = async (req, res) => {
    try {
        const num1 = req.body.num_1;
        const num2 = req.body.num_2;
        const num3 = req.body.num_3;
        const num4 = req.body.num_4;
        const code = parseInt(num1 + num2 + num3 + num4);
        
        const foundOtp = await otpcollection.findOneAndDelete({ number: code });
        
        if (foundOtp) {
            const succ = "Successfully Created Your Account"
            await usercollection.create(req.session.userData);
            res.render("user/successtic", { user: req.session.userData, succ });
        } else {
            res.render('user/validation', { fail: "Please Check Your OTP", user: req.session.userData,});
        }
    } catch (error) {
        console.log(error); 
        const message = error.message;
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};

 


const resendOtp = async(req,res)=>{
    //   otp generator
      
       try {
           let randomOTP = Math.floor(Math.random() * 9000) + 1000;
           console.log('This is your resend OTP:', randomOTP);
           let entrie = 0;
   
           // Save the random OTP number to the database
           const newUser = new otpcollection({
               number: randomOTP
           });
   
           await newUser.save();
   
           res.render('user/validation', { user: req.session.user, entrie });
       } catch (error) {
           console.log("Error generating OTP:", error);
           res.status(500).send("OTP error");
           const message = error.message;
           res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
       }
   
   
   }




const shop = async (req, res) => {
    try {
      const userDetails = await usercollection.findOne({ email: req.session.user });
      let cartCount, cart;
      let wishlist, name
      if (userDetails) {
        name = userDetails.name;
        cart = userDetails.cart;
        cartCount = cart.items.length;
        wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
      }
      const userdata = await usercollection.findOne({email:req.session.user})
    //  const name = userdata.name
      const category = await categoryCollection.find({ isavilable: true });
  
      // Pagination logic
      const productsPerPage = 6; // Change this to your desired number of products per page
      const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
      const skip = (page - 1) * productsPerPage;
  
      const totalProducts = await productCollection.countDocuments({ availability: true });
  
      const totalPages = Math.ceil(totalProducts / productsPerPage);
  
      const products = await productCollection
        .find({ availability: true })
        .skip(skip)
        .limit(productsPerPage);
  
      res.render('user/shop', {
        title: 'e-Commerce',
        message: '',
        products,
        category,
        user: req.session.user,
        cartCount,
        totalPages,
        currentPage: page,
        wishlist,
        name
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });    }
  };


  const filter = async(req, res) => {
    try{ 

    //  const userdata = await usercollection.findOne({email:req.session.user})
    //     cart = userdata.cart;
    //     cartCount = cart.items.length;
      
    //  const name = userdata.name
     const cat_name = req.body.category;
     console.log(typeof cat_name)
     const sortFilter = req.body.sortOption;
     console.log(cat_name, sortFilter)
     let sortDirection = 1; // Default ascending
     if (sortFilter === 'HeighToLow') {
         sortDirection = -1; // Descending
     }
     
     const category = await categoryCollection.find({isavilable:true})
     const products = await productCollection.find({category:cat_name,availability:true}).sort({ price: sortDirection});
 
    //  console.log(products)
     res.render('user/shop', {products,category,user: req.session.user,sortFilter,cat_name,priceRange:'Price-'});
   }catch(error){
    res.render('user/login')
     console.log(error.message);
   } 
    }




const successTick = async (req, res) => {
    try {
        if (req.session.user) {
            const userData = await usercollection.findOne({ email: req.session.user })
            const name = userData.name
            const cart = userData.cart.items
            let cartCount = cart.length
            res.render('user/successtic', { title: "Account", succ: "Success.....", cartCount, name })
        }
    } catch (error) {
        console.log(error.message)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

// single product view
const productView = async (req, res) => {
    console.log(' hi i am product view page');
    try {
        const userData = await usercollection.findOne({ email: req.session.user });
        const id = req.params.id;
        // console.log(id);
        const data = await productCollection.findOne({ _id: id });
        // const cate = data.category[0];
        // const category = await ProductModel.find({ category: cate }).sort({ _id: -1 }).limit(4);
        let cart, cartCount;
        let wishlist;
        const price = data.originalprice - ((data.originalprice * data.productOffer) / 100)
        if (userData) {
            cart = userData.cart.items;
            cartCount = cart.length;
            wishlist = userData.wishlist.length
            console.log('this is the wishlist count ', wishlist)
            res.render('user/product-view', { user: req.session.user, price, data, cartCount ,wishlist})
        } else {
            res.render('user/product-view', { user: req.session.user, price, data, cartCount, wishlist })
        }

        res.render('user/product-view', { data, user: req.session.user })
    } catch (error) {
        console.log("detaild page error" + error)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}




const signout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                res.send('Error')
            } else {
                res.redirect('/')
            }
        })

    } catch (error) {
        console.log(err);
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
} 

//cart section

const loadcart = async (req, res) => {
    try {
        if (req.session.user) {
            const userEmail = req.session.user;
            const userDetails = await usercollection.findOne({ email: userEmail })
            const name = userDetails.name
            const similarproducts = await productCollection.find({ availability: true }).sort({ name: -1 }).limit(4)
            const cartItems = userDetails.cart.items
            const cartCount = cartItems.length
            const wishlist = userDetails.wishlist.length
            console.log('this is the wishlist count ', wishlist)
            const cartProductIds = cartItems.map(item => item.productId);
            const cartProducts = await productCollection.find({ _id: { $in: cartProductIds } });
            const productsPrice = cartItems.reduce((accu, element) => accu + (element.quantity * element.price), 0);
            const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
            let totalPrice = 0;
            for (const item of cartItems) {
                const product = cartProducts.find(prod => prod._id.toString() === item.productId.toString());
                if (product) {
                    totalPrice += item.quantity * product.price;
                } else {
                    console.log(`Product not found for item: ${item.productId}`);
                }
            }
            const user = true
            const discount = Math.abs(totalPrice - productsPrice);
            console.log(' man i am the discount')
            console.log(discount)
            res.render('user/cart', { message: "Login Page", user, name, cartCount, cartItems, cartProducts, productsPrice, totalQuantity, totalPrice, discount, similarproducts,wishlist })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
        //   res.status(500).send("Internal error from cart side");
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }

} 



//Add to cart 

const Addcart = async (req, res) => {
    try {
        console.log('hello man this is add to cart')
        const id = req.params.id
        const userEmail = req.session.user
        const userdata = await usercollection.findOne({ email: userEmail })
        const cartItems = userdata.cart.items
        const existingCartItem = cartItems.find(item => item.productId.toString() === id);

        const product = await productCollection.findOne({ _id: id })
        const productprice = product.price


        console.log('this is ', product.price)
        console.log(' this is ', product.originalprice);

        if (existingCartItem) {
            existingCartItem.quantity += 1;
            existingCartItem.price = existingCartItem.quantity * productprice
        } else {
            const newcartitem = {
                name:product.name,
                productId: id,
                quantity: 1,
                realPrice: product.price,
                price: product.originalprice,
                offer: product.price
            }
            userdata.cart.items.push(newcartitem)
        }

        await userdata.save()
        res.json('successfully cart u r product')



    } catch (error) {
        console.log(error);
        // res.status(500).send("Internal error from cart side");
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const cartQuantityUpdate = async (req, res) => {
    try {
        const cartId = req.params.itemId;
        const data = Number(req.body.quantity);
        const userEmail = req.session.user;
        const userDetails = await usercollection.findOne({ email: userEmail });

        const cartItems = userDetails.cart.items;

        const cartItem = userDetails.cart.items.id(cartId);
        console.log(`this is cart item ${cartItem}`);
        console.log(cartId);
        const cartQuantityPre = cartItem.quantity;
        const CartQuantity = cartItem.quantity = data;
        const offerPrice = cartItem.offer;
        const cartPrice = cartItem.realPrice = offerPrice * CartQuantity;
        const product = await productCollection.findById(cartItem.productId);
        const ProQuantity = product.quantity;

        // if(ProQuantity < data) throw new Error("Product out of stock")

        // const count = CartQuantity - cartQuantityPre;
        // product.quantity -= count;
        const GPrice = cartItems.reduce((accu, element) => accu + (element.quantity * element.price), 0);
        const T = cartItems.reduce((accu, element) => accu + element.realPrice, 0);
        const GrandPrice = userDetails.grantTotal = GPrice;
        const Total= userDetails.total = T;
        // await product.save();
        await userDetails.save();

        console.log(cartItems);
        console.log(GrandPrice)
        console.log(Total);
        const grantTotal = GrandPrice;
        const total = Total;
        const discount = grantTotal - total;
        res.json({ cartPrice, grantTotal, total, discount, ProQuantity });

    } catch (error) {
        console.log(error);
        // res.status(500).json({ error: 'An error occurred while updating the quantity.' });
        const message = error.message
 res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};




const cartDelete = async (req, res) => {
    console.log('i am cart deleter');
    try {
        const id = req.params.id;
        const userEmail = req.session.user;
        console.log(userEmail);
        await usercollection.updateOne({ email: userEmail }, { $pull: { 'cart.items': { _id: id } } });
        res.redirect('/cart');
    } catch (error) {
        console.log(error);
        // res.status(500).send("internal error at cartDelete")
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}


//coupens
const coupons = async (req, res) => {
    try {
        console.log('i am coupen deducter')
        console.log('this is the body values',req.body) 
        const couponCode = req.body.coupon;
        const TotalAmount = req.body.amount;
        console.log(couponCode, TotalAmount);

        const user = req.session.user;
        const userDetails = await usercollection.findOne({ email:user});

        const userDataId = userDetails._id;
        console.log(user)

        const couponValue = await couponcollection.findOne({ couponName:couponCode});
        const date = new Date();
        const formattedDate = date.toLocaleDateString();
        // const expiryDate = couponValue.expiryDate;
        // const expiryDateFormatted = expiryDate.toLocaleDateString();
        // console.log(expiryDateFormatted);
        

        if (!couponValue) {
            res.json({ message: 'Coupon Not Valid' });
        } else if (couponValue) {
            const userExist = couponValue.userId.includes(userDataId);
            if (!userExist) {
                if (TotalAmount <= couponValue.maxValue && TotalAmount >= couponValue.minValue) {
                    // , { $push: { userId: userDataId } }
                    await couponcollection.updateOne({ couponName: couponCode }, { $push: { userId: userDataId } });
                    res.json({ message: 'Coupon is succefully Added', coupon: couponValue });
                } else {
                    res.json({ message: 'Coupon Expired', coupon: couponValue });
                }
            } else {
                res.json({ message: 'You Already Use This Coupon', coupon: couponValue });
            }

        }
        console.log(couponValue)
    } catch (error) {
        console.log(error);
        res.json('CouponExpired');
    }
}


//whish list 
const WhishListLoad = async (req, res) => {
    try {
        if (req.session.user) {
            const userEmail = req.session.user;
            const userDetails = await usercollection.findOne({ email: userEmail });
            const name =  userDetails.name
            const productData = userDetails.wishlist;
            const cart = userDetails.cart.items;
            const cartCount = cart.length;
            const wishlist = userDetails.wishlist.length
            console.log('this is the wishlist count ', wishlist)
            const productId = productData.map(items => items.productId);
            const productDetails = await productCollection.find({ _id: { $in: productId } });
            const price = productDetails.originalprice - (productDetails.originalprice * productDetails.productOffer) / 100

            res.render('user/wishList', { user, price, productDetails, cartCount,name,wishlist })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const addingWhishList = async (req, res) => {
    console.log('hey i am the add wishlist');
    try {
        const productId = req.params.id;
        const userEmail = req.session.user;
        const userDetails = await usercollection.findOne({ email: userEmail });
        const productExist = userDetails.wishlist.map(items => items.productId.toString() === productId);


        if (productExist.includes(true)) {
            return res.json("Already Exist");
        } else {
            const WhishList = {
                productId: productId
            }
            userDetails.wishlist.push(WhishList);
            await userDetails.save();
            return res.json('server got this....');
        }
    } catch (error) {
        console.log(error);
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const WhishProductDelete = async (req, res) => {
    console.log('hello i am the wishlist delete');
    try {
        const productId = req.params.id;
        const userEmail = req.session.user;
        await usercollection.findOneAndUpdate(
            { email: userEmail },
            { $pull: { wishlist: { productId: productId } } }
        );
        res.redirect("/wishlist");
    } catch (error) {
        console.log("whish deleting Error" + error)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const addingWhishListtoCart = async (req, res) => {
    try {
        console.log('hello i am the wishlist adding to cart')
        const id = req.body.productId;
        const userEmail = req.session.user;
        const userData = await usercollection.findOne({ email: userEmail });
        const cartItems = userData.cart.items;
        const existingCartItem = cartItems.find(item => item.productId.toString() === id);
        const cartPrtoduct = await productCollection.findOne({ _id: id });
        const productPrice = cartPrtoduct.price;

        if (existingCartItem) {
            existingCartItem.quantity += 1;
            existingCartItem.price = existingCartItem.quantity * productPrice;
        } else {
            const newCartItem = {
                productId: id,
                quantity: 1,
                price: cartPrtoduct.finalPrice,
                realPrice: cartPrtoduct.price
            };
            userData.cart.items.push(newCartItem);
        }

        await userData.save();
        res.json("successfully cart u r product")
    } catch (error) {
        console.log('Error adding to cart:', error);
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};

// /////////////////////////////////////////////////////////////////////////////////

// checkout 
const Checkout = async (req, res) => {
    try {
        console.log(' hey i am the checkout form');
        // const user = req.session.user;
        const email = req.session.user;
        const userDetails = await usercollection.findOne({ email:email});
        const name = userDetails.name
        const currentUserID = userDetails._id;
        const cartItems = userDetails.cart.items;
        const cartCount = cartItems.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const coupons = await couponcollection.find();
        console.log('this is a coupons',coupons)
        const coupon = coupons.filter(coupon => !coupon.userId.includes(currentUserID));
        const cartProductIds = cartItems.map(item => item.productId.toString());
        const cartProducts = await productCollection.find({ _id: { $in: cartProductIds } });
        const totalP_Price = cartItems.reduce((total, items) => total + parseFloat(items.realPrice), 0);
        const address = userDetails.address;
        let totalPrice = cartItems.reduce((accu, element) => accu + (element.quantity * element.price), 0)
        const discount = Math.abs(totalP_Price - totalPrice)
        res.render('user/account/billing', {
            title: "Check Out",
            user,
            name,
            cartItems,
            cartProducts,
            discount,
            totalP_Price,
            totalPrice,
            address,
            cartCount,
            coupon,
            wishlist
        })
    } catch (error) {
        console.log(error);
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const addressAdding = async (req, res) => {
    console.log('hey i am address adding function ');
    try {

        const email = req.session.user;
        const { name, houseName, street, city, state, phone, postalCode } = req.body;

        const userData = await usercollection.findOne({ email: email });

        if (!userData) {
            return console.log("User not found")
        }

        const newAddress = {
            name: name,
            houseName: houseName,
            street: street,
            city: city,
            state: state,
            phone: phone,
            postalCode: postalCode
        };

        userData.address.push(newAddress);
        await userData.save();
        res.redirect('/CheckOutPage');
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};

////////////////////// order placing


let newOrder;
const orderSuccess = async (req, res) => { 
    try {
        console.log('this is the order successful function')
        const currentDate = new Date();
        const data = req.body
        const email = req.session.user;
        const foundUser = await usercollection.findOne({ email: email });
        // console.log(foundUser);
        const cartItems = foundUser.cart.items;
        console.log('this is cart items',cartItems);
        const cartProductIds = cartItems.map(item => item.productId.toString());
        const cartProducts = await productCollection.find({ _id: { $in: cartProductIds }});
        console.log('this is the cart products',cartProducts)
         const cart_quantity = cartProducts.map(item=> item.quantity);
         console.log('this is the real cart quantity',cart_quantity);
        const userId = foundUser._id;
        const addressId = data.selectedAddress;
        const method = data.method; 
        const amount = data.amount;
        console.log(('hey man this your ordered amount'));
        console.log(amount)
      
        const productData = cartProducts.map(product => {
            const cartItem = cartItems.find(item => item.productId.toString() === product._id.toString());
            const quantity = cartItem ? cartItem.quantity : 0;
            return {        
              productId:product._id,
              name: product.name,
              realPrice: product.price,
              price: amount,
              description: product.discription,
              image: product.image,
              category: product.category,
              quantity: quantity 
            }
          });

        const deliveryDate = new Date();
        deliveryDate.setDate(currentDate.getDate() + 5);

        
        newOrder = new ordercollection({
            userId: userId,
            address: addressId,
            products: productData,
            payment: {
                method: method,
                amount: amount
            },
            status: "Processing",
            proCartDetail: cartProducts,
            cartProduct: cartItems,
            createdAt: currentDate,
            expectedDelivery: deliveryDate
        });


        console.log(method)
        if (method === "InternetBanking") {
            console.log('hello i am the netbanking')
            const instance = new Razorpay({key_id: key_id,key_secret: key_secret });
                let order = await instance.orders.create({
                    amount: amount * 100,
                    currency: "INR",
                    receipt: '"order_rcptid_11"',
                })
               
                console.log('hello man')
                res.json(order);
                // res.json("successFully online payment Completed")


        } else if (method === "COD") {
            await newOrder.save();
            for (let values of cartItems) {
                for (let products of cartProducts) {
                    if (new String(values.productId).trim() == new String(products._id).trim()) {
                        products.quantity = products.quantity - values.quantity;
                        
                        await products.save()
                    }
                }
            }
            foundUser.cart.items = [];
            foundUser.grantTotal = 0;
            foundUser.total = 0;
            await foundUser.save();
            res.json({message:"successFully cod Completed", newOrder,amount})
            console.log(res.message)

        } else if (method === 'wallet') {
            // await newOrder.save();
            console.log('i am the wallet')
            const email = req.session.user;
            const user_data = await usercollection.findOne({ email });
            const wallet = user_data.walletbalance;
            console.log('this is my wallet balance',wallet)
        
            const productTotal = calculateProductTotal(cartItems, cartProducts);
            console.log(productTotal)
            function calculateProductTotal(cartItems, cartProducts) {
                let productTotal = 0;
                for (let values of cartItems) {
                    for (let products of cartProducts) {
                        if (String(values.productId).trim() === String(products._id).trim()) {
                            productTotal += products.price * values.quantity;
                        }
                    }
                }
                return productTotal;
            } 
           console.log('hello man this place still done i think',productTotal)
            if(wallet < productTotal){
                console.log('insufficient balance')
                res.json("Insufficient balance in the wallet"); 
                // res.status(400).json("Insufficient balance in the wallet");
            } else{
                // Sufficient balance in the wallet
                console.log('i am good wallet')
                const w_balance = wallet - productTotal;
                console.log('after deducting value',w_balance)
                console.log('man this is saving time')
                console.log('data',user_data)
              
                // console.log('wallet history is saved');
                try {
                    console.log('this is neworder saving');
                    user_data.walletbalance = w_balance;
                    await user_data.save();
                    await newOrder.save();
                    user_data.wallethistory.push({
                        process: "Payment",
                        amount:  productTotal,
                    });
         
                    // Deduct product quantities and save
                    for (let values of cartItems) {
                        for (let products of cartProducts) {
                            if (String(values.productId).trim() === String(products._id).trim()) {
                                products.quantity -= values.quantity;
                                await products.save();
                            }
                        }
                    }
        
                    // Clear user's cart and send success response
                    foundUser.cart.items = [];
                    foundUser.grantTotal = 0;
                    foundUser.total = 0; 
                    await foundUser.save();

                    console.log('this is end i think may be')
        
                    res.json({message:"Successfully completed the payment using the wallet",newOrder});
                } catch (error) {
                    console.error("Error during transaction:", error);
                    res.status(500).json("An error occurred during the transaction.");
                }
            }
            
            
                
            
        }

         else {
            res.status(400).send("individual payment")
        }

    } catch (error) {
        console.log('data not comming');
        res.status(500).send('An error occurred While saving data in DB');
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const savingData = async (req, res) => {
    try {
        await newOrder.save();
        const email = req.session.user;
        const userData = await usercollection.findOne({ email: email });
        const cartItems = userData.cart.items;
        const cartProductIds = cartItems.map(item => item.productId.toString());
        const cartProducts = await productCollection.find({ _id: { $in: cartProductIds } });

        for (let values of cartItems) {
            for (let product of cartProducts) {
                if (String(values.productId).trim() === String(product._id).trim()) {
                    product.quantity -= values.quantity;
                    await product.save();
                }
            }
        }

        userData.cart.items = [];
        await userData.save();
        res.json({message:"data is saved",newOrder})
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while saving the order and updating product quantities');
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};

const category = async (req, res) => {
    console.log('i am the category');
    try {
        console.log('i am inside')
        const cate = req.body.selectedValue
        const products = await productCollection.find({ category: cate }, {})
        const category = await categoryCollection.find({ isavilable: true })

        res.render('user/shop', { products, category, user: false })
    } catch (error) {
        console.log(error.message);
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const cancelSingleProduct = async (req, res) => {
     console.log('i am the single product delete function')
    const id = req.params.id
    const email = req.session.user
    
    try{
        const data = await usercollection.findOne({ email: email })
        const orders = await ordercollection.findOne()
        console.log(orders)
    
        // const orders = await ordercollection.findOneAndDelete({_id:id})
        

    }catch(error) {
        console.log(error.message);
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
   
   
    
}


module.exports = {
    category,
    home,
    search_product,
    productView,
    login,
    signup,
    signup_post,
    login_post,
    forGotPassword,
    numberValidation,
    newPassword,
    resetPassword,
    signout,
    login_OTPValidation,
    signup_Otpvalidation,
    successTick,
    WhishListLoad,
    addingWhishList,
    WhishProductDelete,
    addingWhishListtoCart,
    Addcart,
    coupons,
    loadcart,
    cartQuantityUpdate,
    cartDelete,
    Checkout,
    addressAdding,
    orderSuccess,
    savingData,
    shop,
     filter,
    successTick,
    resendOtp,
    cancelSingleProduct,

}