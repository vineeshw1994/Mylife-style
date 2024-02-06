const isAdmin = (req, res, next) => {
    if (req.session.admin) {
        res.redirect('/admin/dashboard')
    } else {
        next()
    }
}
const isLogOut =(req,res,next)=>{
    if(!req.session.admin){
        res.redirect('/admin/login'); 
    }else{
        next()
    }
}

module.exports = {
    isAdmin,
    isLogOut
}
