//configure dotenv
require('dotenv').config();

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

//Configure express
const app = express()

const router = express.Router()

// Importing app routes
const TransactionRoutes = require('./Routes/Transaction.Routes')(router)

app.use(express.static(__dirname+'/Public'))
app.use(express.urlencoded({limit:'50mb'}))
app.use(express.json({limit:'50mb'}))
app.set('trust proxy', 1) // trust first proxy
app.use(cors())

app.use('/api/v1/', TransactionRoutes)

app.set('port', process.env.PORT)

app.listen(app.get("port"), (e)=>{
    console.log(">>> Private Airtel Money Gateway Listening On Port %s", app.get('port'))
})
