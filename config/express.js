const cors = require("cors") 
const express = require("express") 
const consign = require("consign") 
const bodyParse = require("body-parser") 


const app = express()

app.use(cors())
app.options("*", cors())
app.use(bodyParse.urlencoded({extended: true, limit: "10mb"}))
app.use(bodyParse.json({"limit": "10mb"}))

consign({cwd: "app", verbose: true})
    .include("config/db")
    .include("controllers")
    .include("routes")
    .into(app)
    
module.exports = app