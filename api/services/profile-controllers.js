const usercollection = require('../../models/usermodel')
const productcollection = require('../../models/productmodel')
const ordercollection = require('../../models/order')
const bcrypt = require('bcrypt');
const easyinvoice = require('easyinvoice');
const { log } = require('util');
const Razorpay = require('razorpay')

const key_id = 'rzp_test_kjs3Abj9teKyq6'
const key_secret = 'oo3gc41lM7OUEGWwjuFfLx0S'




const pwdEncription = (password) => {
    const hashedPWD = bcrypt.hash(password, 10)
    return hashedPWD
}


const profile = async(req,res)=>{
    try {
        if(req.session.user){
        console.log('i am profile')
        const userDetails = await usercollection.findOne({ email: req.session.user });
        let cart = userDetails.cart.items;
        let cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const name = userDetails.name;
        const user = true
        const FoundUser = req.session.user;
        const userData = await usercollection.findOne({ email: FoundUser });
        res.render('user/account/profile', { user,userData, cartCount ,name,wishlist});
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}



const profileAddress = async (req, res) => {
    try {
        // const user = req.session.user;
        const userEmail = req.session.user;
        const userData = await usercollection.findOne({ email: userEmail });
        let cart = userData.cart.items;
        let cartCount = cart.length;
        const wishlist = userData.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const userAddress = userData.address; 
        const name = userData.name
        res.render('user/account/address', { userAddress, cartCount,name,wishlist})
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}
const updateaddress = async (req, res) => {
    try {
        const email = req.session.user;
        const { name, houseName, street, city, state, phone, postalCode, AddressId } = req.body;
        const userData = await usercollection.findOne({ email: email });
        const exisitingAddress = userData.address.find((data) => data._id.toString() === req.body.AddressId);

        if (exisitingAddress) {
            exisitingAddress.name = name;
            exisitingAddress.houseName = houseName;
            exisitingAddress.street = street;
            exisitingAddress.city = city;
            exisitingAddress.state = state;
            exisitingAddress.phone = phone;
            exisitingAddress.postalCode = postalCode;
        } else {
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
        }
        await userData.save();
        res.redirect('/profile/address');
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};
const editAddress = async (req, res) => {
    try {
        console.log('i am address editor')
        // const user = req.session.user;  
        const addressId = req.body.selectedAddress;
        const userDetails = await usercollection.findOne({ email: req.session.user });
        const name = userDetails.name
        const cart = userDetails.cart.items;
        const cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const address = userDetails.address;
        const selectedAddress = address.find((data) => data._id.toString() === addressId);
        res.render('user/account/editaddress', {  selectedAddress, cartCount,name,wishlist }) 
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const profileUpdate = async (req, res) => {
    console.log('i am the profile update')
    try {
        const userEmail = req.session.user;
        const userData = await usercollection.findOne({ email:userEmail});
        console.log(userData)
        let cart = userData.cart.items;
        let cartCount = cart.length;
        const wishlist = userData.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const { name, email, number, password, password1, password2 } = req.body;
        if (password1 !== password2) {
            res.render('user/account/profile', { title: "Profile", user, userData, error: "Check the password currectly" });
        }
        const isMatch = await bcrypt.compare(password, userData.password);
        if (isMatch) {
            const encryptedPwd = await pwdEncription(password1);
                userData.name = name,
                userData.email = email,
                userData.mobile = number,
                userData.password = encryptedPwd;
            await userData.save();
            req.session.email = userData.email
            req.session.user = userData.name
            res.render('user/account/profile', { title: "Profile", user, userData, success: "Successfully Updated", cartCount,wishlist });
        } else {
            res.render('user/account/profile', { title: "Profile", user, userData, error: "Please check Your Current Password & Updated Email ID", cartCount, wishlist });
        }
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
} 

const order = async (req, res) => { 
    try {
        console.log('i am the order list')
        // const user = req.session.user;
        const email = req.session.user;
        const userDetails = await usercollection.findOne({ email: email });
       // console.log(userDetails)
       const name = userDetails.name;
        const cart = userDetails.cart.items;
        const cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const userid = userDetails._id;
        const order = await ordercollection.find({ userId: userid, orderReturnRequest: false, orderCancleRequest: false, status: {$ne: 'Deliverd' } }).sort({ _id: -1 });
        const orderHist = await ordercollection.find({
            userId: userid,
            $or: [
                { orderCancleRequest: true },
                { status: 'Deliverd' }
            ], orderReturnRequest: false,
        }).sort({ _id: -1 });
        const orderProducts = orderHist.map(data => data.products);
        const orderProduct = orderProducts.flat();
        const orderHistStatus = orderHist.map(data => data.orderCancleRequest);
        const orderHista = orderHist.map(data => data.status);


        const product = order.map(data => data.products);
        const newProduct = product.flat();
        const status = order.map(data => data.status);
        const orderstatus = order.map(data => data.orderCancleRequest);
        const Date = order.map(data => data.expectedDelivery.toLocaleDateString());
        res.render('user/account/myorder', {
            title: "OrderPage",
            name,
            user,
            newProduct,
            status,
            Date,
            order,
            orderstatus,
            cartCount,
            orderHist,
            orderProduct,
            orderHistStatus,
            orderHista,
            name,
            wishlist
        });
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const listReturn = async (req, res) => {
    try {
        const user = req.session.user;
        const userDetails = await usercollection.findOne({ email: user });
        console.log(userDetails)
        const name = userDetails.name
        const cart = userDetails.cart.items;
        const cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const userid = userDetails._id; 
        const returnProduct = await ordercollection.find({
            userId: userid, 
            orderReturnRequest: true
        });

        console.log(returnProduct)
        res.render("user/account/return", {
            title: "OrderPage",
            name,
            user,
            cartCount,
            returnProduct,wishlist
        })
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const orderReturn = async (req, res) => {
    try {
        const id = req.params.id;
        await ordercollection.findByIdAndUpdate({ _id: id },
            {
                $set: {
                    orderReturnRequest: true,
                    status: "Return Requested"
                }
            });

        res.redirect('/profile/order');
    } catch (error) {
        console.log(error)
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const orderStatus = async (req, res) => {
    try {
        // const user = req.session.user;
        const userDetails = await usercollection.findOne({ email: req.session.user });
        const cart = userDetails.cart.items;
        const cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const orderId = req.params.id;
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
        const subTotal = cartProducts.reduce((totals, items) => totals + items.realPrice, 0);
        console.log('this is subtotal ',subTotal) 
        const [orderCanceld] = order.map(item => item.orderCancleRequest);
        const orderStatus = order.map(item => item.status);
        res.render("user/account/orderstatus", { title: "Product view", user, cartCount, order, orderProducts, subTotal, address, orderCanceld, orderStatus,wishlist })
    } catch (error) {
        console.log(error)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const orderView = async (req, res) => {
    try {
        // const user = req.session.user;
        const userDetails = await usercollection.findOne({ email: req.session.user });
        const cart = userDetails.cart.items;
        const cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        const orderId = req.query.id;
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
        const subTotal = cartProducts.reduce((totals, items) => totals + items.realPrice, 0);
        const [orderCanceld] = order.map(item => item.orderCancleRequest);
        const orderStatus = order.map(item => item.status);
        res.render("user/account/orderStatus", { title: "Product view", user, cartCount, order, orderProducts, subTotal, address, orderCanceld, orderStatus,wishlist })
    } catch (error) {
        console.log(error)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};

const orderCancel = async (req, res) => {
    try {
        const id = req.params.id;
        let amount = await ordercollection.findById({_id:id})
        console.log('this is my order amount',amount.proCartDetail.price)
        await ordercollection.findByIdAndUpdate({ _id: id },
            {
                $set: {
                    orderCancleRequest: true
                }
            });



        res.redirect('/profile/order');
    } catch (error) {
        console.log(error)
        const message = error.message
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const generateInvoice = async (order, orderProducts, subTotal, address, orderCanceld, orderStatus ) => {
    try {
        const invoiceOptions = {
            documentTitle: 'Invoice',
            currency: 'INR',
            taxNotation: 'GST',
            marginTop: 25,
            marginRight: 25,
            marginLeft: 25,
            marginBottom: 25,
            images: {
                logo: '',
            },
            sender: {
                company: 'E-Shop',
                address: 'Kazhakuttam',
                zip: '695121',
                city: 'Trivandrum',
                country: 'Kerala',
                phone: '759-857-0568',
            },
            client: {
                company: address.name,
                address: address.houseName,
                zip: address.street,
                city: address.city,
                country: address.phone,
                phone: address.postalCode
            },
            information: {
                Number: order.map(item=>item._id),
                Date: order.map(item=>item.createdAt.toLocaleDateString()),
                Delevery_Date: order.map(item=>item.expectedDelivery.toLocaleDateString())
            },
            products: [],
           
            bottomNotice: 'Discount: $10',
            subtotal: 185,
            total: 175,
        };
        orderProducts.forEach((data) => {
            invoiceOptions.products.push({
                quantity: data.cartProduct.quantity,
                description: data.name,
                'tax-rate': 0,
                price: data.cartProduct.realPrice, 
            });
        });
        const result = await easyinvoice.createInvoice(invoiceOptions);
        const pdfBuffer = Buffer.from(result.pdf, 'base64');

        return pdfBuffer;
    } catch (error) {
        console.log('Error generating invoice:', error);
        throw error;
    }
};


const pdf = async (req, res) => {
    try {
        const orderId = req.query.id;
        const userDetails = await usercollection.findOne({ email: req.session.user });
        const order = await ordercollection.find({ _id: orderId });
        const orderProducts = order.map(items => items.proCartDetail).flat();
        const cartProducts = order.map(items => items.cartProduct).flat();
        console.log(cartProducts)
        for (let i = 0; i < orderProducts.length; i++) {
            const orderProductId = orderProducts[i]._id;
            const matchingCartProduct = cartProducts.find(cartProduct => cartProduct.productId.toString() === orderProductId.toString());

            if (matchingCartProduct) {
                orderProducts[i].cartProduct = matchingCartProduct;
            }
        }
        const address = userDetails.address.find(items => items._id.toString() == order.map(items => items.address).toString());
        const subTotal = cartProducts.reduce((totals, items) => totals + items.realPrice, 0);
        const [orderCanceld] = order.map(item => item.orderCancleRequest);
        const orderStatus = order.map(item => item.status);
    
        const invoiceBuffer = await generateInvoice(order, orderProducts, subTotal, address, orderCanceld, orderStatus );
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename = invoice.pdf');
        res.send(invoiceBuffer);
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};


const  loadWallet = async (req,res)=>{
    try{
        const userDetails = await usercollection.findOne({ email: req.session.user });
        const name = userDetails.name;
        const cart = userDetails.cart.items;
        const cartCount = cart.length;
        const wishlist = userDetails.wishlist.length
        console.log('this is the wishlist count ', wishlist)
        console.log(userDetails)
        const wallet_Balance = userDetails.walletbalance;
        console.log('this is my wallet balance ', wallet_Balance) 
        let totalProducts = 0;
        for (let i = 0; i < userDetails.cart.length; i++) {
            totalProducts += userDetails.cart[i].quantity;
        }
        res.render('user/account/wallet',{userDetails,totalProducts,wallet_Balance,name,cartCount,wishlist});
    }
    catch(err){
        console.log("Error in loading wallet",err);
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
};

const topUpWallet = async(req,res)=>{
    console.log('i am the topup ')
    const razorpayInstance = new Razorpay({
        key_id: 'rzp_test_kjs3Abj9teKyq6',
        key_secret: 'oo3gc41lM7OUEGWwjuFfLx0S',
    });
    try{
        const topUpAmount=req.body.topUpAmount;
        const user= await usercollection.findOne({email:req.session.user});
        const amount = topUpAmount * 100
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'razorUser@gmail.com'
        }

        razorpayInstance.orders.create(options,
            (err, order) => {
                if (!err) {
                    res.status(200).send({
                        // method:'UPI',
                        success: true,
                        amount: amount,
                        key_id: 'rzp_test_kjs3Abj9teKyq6',
                        contact: "9074916473",
                        name: user.name,
                        email: req.session.user,
                        topUpAmount:topUpAmount
                        
                    });
                }
                else {
                    console.log(err);
                    res.status(400).send({ success: false, msg: 'Something went wrong!' });
                }
            }
        );
        
    }
    catch(err){
        console.log("Error in topping up",err);
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const verifyTopUp =async (req,res)=>{
    try{
        // console.log("body",req.body);
        const topUpAmount=req.body.topUpAmount;
        const user = await usercollection.findOne({email: req.session.user });
        await usercollection.updateOne({email:req.session.user},{ $inc: { walletbalance: topUpAmount }}); 
        // wallet history
        user.wallethistory.push({
            process: "TopUp",
            amount: topUpAmount
        });
        await user.save();
        res.status(200).send({success:true});
    }
    catch(err){
        console.log("error in verifying topup",err);
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}

const loadWalletHistory = async(req,res)=>{
    try{
        const userDetails = await usercollection.find({ email: req.session.user });
        const name = userDetails.name;
        // const cart = userDetails.cart.items;
        // const cartCount = cart.length;
        let totalProducts = 0; 
        for (let i = 0; i < userDetails[0].cart.length; i++) {
            totalProducts += userDetails[0].cart[i].quantity;
        }
        // const user = await usercollection.findOne({ username: req.session.user });
        res.render('user/account/walletHistory',{userDetails,totalProducts,name});
    }
    catch(err){
        console.log("Error in loading wallet history",err);
        res.status(500).render('404-error', {  error:500, message:'Internal Server Error' });
    }
}



  

module.exports = {
    profile,
    order,
    profileAddress,
    editAddress,
    updateaddress,
    profileUpdate,
    orderStatus,
    orderView,
    orderCancel,
    listReturn,
    orderReturn,
    pdf,
    loadWallet,
    topUpWallet,
    verifyTopUp,
    loadWalletHistory,
}