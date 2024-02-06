const form = document.querySelector('#login-Form')
const useremail = document.querySelector('#email');
const password = document.querySelector('#password');

form.addEventListener('submit',(e)=>{
 
    if(!validateInputs()){
        e.preventDefault();
    }
   })
   
   function validateInputs(){
    const useremailVal = useremail.value.trim()
    const passwordVal = password.value.trim();
    let success = true
   
    if(useremailVal===''){
        success=false;
        setError(useremail,'Email Id is required')
    } else if(!validateEmail(useremailVal)){
               success = false;
               setError(email,'Please enter a valid email')
    }
    else{
        setSuccess(useremail)
    }
   
   
    if(passwordVal === ''){
        success= false;
        setError(password,'Password is required')
    }
    else if(passwordVal.length<5){
        success = false;
        setError(password,'Password must be atleast 5 characters long')
    }
    else{
        setSuccess(password)
    }
   
    return success;
   
   }
   
   function setError(element,message){
    const inputGroup = element.parentElement;
    const errorElement = inputGroup.querySelector('.error')
   
    errorElement.innerText = message;
    inputGroup.classList.add('error')
    inputGroup.classList.remove('success')
   }
   
   function setSuccess(element){
    const inputGroup = element.parentElement;
    const errorElement = inputGroup.querySelector('.error')
   
    errorElement.innerText = '';
    inputGroup.classList.add('success')
    inputGroup.classList.remove('error')
   }
   
   const validateEmail = (email) => {
           return String(email)
             .toLowerCase()
             .match(
               /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
             );
         };
   
