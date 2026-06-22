const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,"E-mail is required for creating a user"],
        unique:[true,"E-mail already exists"],
        trim:true,
        lowercase:true,
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,'Invalid email address']
    },
    name:{
        type:String,
        required:[true,"Name is required for creating an account"]
    },
    password:{
        type:String,
        required:[true,"Please enter a password"],
        minLength:[6,"Password should be atleast 6 characters long"],
        select:false
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
    }
},{timestamps:true})

userSchema.pre("save",async function(){

    if(!this.isModified("password")){
        return
    }

    const hash = await bcrypt.hash(this.password,10)
    this.password = hash

    return 
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

const userModel = mongoose.model("user",userSchema)

module.exports = userModel