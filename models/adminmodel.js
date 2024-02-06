const mongoose = require('mongoose');


const loginschema = new mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    name : {
        type : String,
    },
    password : {
        type : String,
        required : true
    }
})

const adminCollection = new mongoose.model("admindata",loginschema);


module.exports = adminCollection