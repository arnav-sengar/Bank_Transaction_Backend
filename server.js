require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/config/db')
const port = process.env.PORT || 5000





app.listen(port,()=>{
    console.log(`Server is running on port ${port}...`)
    connectDB()
})