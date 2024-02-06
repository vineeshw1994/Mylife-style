const mongoose =require('mongoose');

const bannerSchema = new mongoose.Schema({
     name:{
        type:String,
        require:true,
     },
     image: [{
        type: String,
        require: true
    }],
     description:{
        type:String,
        
     },
     availability:{
      type:String,
      require:true,
      default: true,
     },
     bannerLink:{ 
        type:String, 
       
     },
     bannerType:{ 
        type:String,
       
     },
     bannerStatus:{ 
        type:String,
        
     },
     createdAt:{
        type:String,
       
     },
     updatedAt:{
        type:String,
        
     },
    
});

const bannersModel  = mongoose.model('banners',bannerSchema);
module.exports = bannersModel;