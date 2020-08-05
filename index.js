
require('dotenv').config();
const express = require('express')
const app = express();
const bodyParser=require('body-parser')
const cors=require('cors')
const authRoutes = require('./routes/auth')
app.use(bodyParser.json());
app.use(cors());
app.use('/api/', authRoutes)

app.listen(process.env.PORT, () => {
    console.log("server up and running in "+process.env.PORT)
})