const mongoose = require('mongoose')

async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB connected successfully")
    } catch (error) {
        console.log("DB connection failed : ",error)
        process.exit(1)
    }
}

module.exports = connectDB