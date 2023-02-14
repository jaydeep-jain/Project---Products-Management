const mongoose = require('mongoose')

//for valid product
const isValidTitle = function (value) {
    return (/^[a-zA-Z][a-zA-Z0-9 $!-_#@%&\.]+$/).test(value)  
       
}

const isValidPrice = function (value) {
    return (/^\d*\.?\d*$/).test(value)        
}

//for valid style
const isValidStyle = function (value) {
    return (/^[a-zA-Z _.-]+$/).test(value)        
}

//for valid object id
const isValidObjectId = function (value) {
    return mongoose.Types.ObjectId.isValid(value)
}

//for blank body
const isValidRequestBody = function (value) {
    return Object.keys(value).length > 0;
}

//for blank spaces & string check
const isValid=function(value){
    if (typeof value === "undefined" || value === null || value == " ") return false;
    if (typeof value === "string" && value.trim().length > 0) return true;
    return false;

}
const isValidSizes=function(sizes){
    return ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'].includes(sizes);
}


module.exports = {isValidSizes, isValid, isValidObjectId, isValidRequestBody, isValidTitle, isValidPrice, isValidStyle }