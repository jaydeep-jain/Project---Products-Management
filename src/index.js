const express=require('express')
const mongoose=require('mongoose')
const route=require('./route/route')
const multer=require('multer')
const app=express()

app.use(express.json())

mongoose.set("strictQuery", false);

app.use(multer().any())


mongoose.connect("mongodb+srv://jaydeepjain:05178@cluster0.aawkugv.mongodb.net/productManagment", {
    useNewUrlParser:true
})
    .then(()=>console.log("mongoDb connected"))
    .catch((err)=>err)

app.use('/',route)

app.use(function(req,res){
    return res.status(400).send("invalid url")
})

const port=3000
app.listen(port,function(){
    console.log('Express running on port '+port)
})