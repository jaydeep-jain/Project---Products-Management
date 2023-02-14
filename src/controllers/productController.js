const productModel = require('../models/productModel')
const { uploadFile } = require('../aws/aws')
const { isValid, isValidSizes, isValidObjectId, isValidRequestBody, isValidTitle, isValidPrice, isValidStyle } = require("../validations/productValidation")
const v = require('../validations/validation')


//------------------------------|| CREATE PRODUCT ||----------------------------------

const createProduct = async function (req, res) {
    try {
        let data = req.body
        let files = req.files

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "request Body cant be empty" });

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = data

        //title
        if (!isValid(title)) return res.status(400).send({ status: false, message: "Please enter title" })
        if (!isValidTitle(title.trim())) return res.status(400).send({ status: false, message: "Enter a proper title" })

        if (await productModel.findOne({ title: title })) return res.status(400).send({ status: false, message: "Title Already exist!!!" })

        //description
        if (!description) return res.status(400).send({ status: false, message: "Please enter description" })
        if (!isValid(description)) return res.status(400).send({ status: false, message: "Please enter description in correct format" })

        //price
        if (!price) return res.status(400).send({ status: false, message: "Please enter price" })
        if (!isValidPrice(price.trim())) return res.status(400).send({ status: false, message: "Enter a proper price" })

        //currencyID
        if (!currencyId) return res.status(400).send({ status: false, message: "Please enter currencyId" })
        currencyId = currencyId.trim().toUpperCase()
        if (!isValid(currencyId)) return res.status(400).send({ status: false, message: "Please enter currency in correct format" })
        if (currencyId != 'INR') return res.status(400).send({ status: false, message: "currencyId invalid" })

        //currencyFormat
        if (!currencyFormat) return res.status(400).send({ status: false, message: "Please enter currencyFormat" })
        if (!isValid(currencyFormat)) return res.status(400).send({ status: false, message: "Please enter currencyFormat in correct format" })
        if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "Please enter a valid currencyFormat" })
        data.currencyFormat = currencyFormat;

        //productImage
        if (files.length == 0) return res.status(400).send({ status: false, message: "Please provide product image file!!" })
        if (!v.isValidImg(files[0].mimetype)) return res.status(400).send({ status: false, message: "Please provide valid product image file!!" })
        let uploadImage = await uploadFile(files[0])

        //availableSizes
        if (!availableSizes) return res.status(400).send({ status: false, message: "available sizes can't be empty" })
        let sizeList = availableSizes.toUpperCase().split(",").map(x => x.trim());
        if (Array.isArray(sizeList)) {
            for (let i in sizeList) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeList[i]))
                    return res.status(400).send({ status: false, message: "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) " })
            }
        }


        let product = {
            title: title,
            description: description,
            price: price,
            currencyId: currencyId,
            currencyFormat: currencyFormat,
            productImage: uploadImage,
            availableSizes: sizeList,
            deletedAt: null
        }

        //isFreeShipping
        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.trim()
            if (!(isFreeShipping == "true" || isFreeShipping == "false"))
                return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping" })

            product.isFreeShipping = isFreeShipping;
        }

        //installments
        if (installments) {
            if (!(/^[0-9]+$/.test(installments))) return res.status(400).send({ status: false, message: "Invalid value for installments" })

            product.installments = installments
        }

        //style
        if (style) {
            if (!isValid(style)) return res.status(400).send({ status: false, message: "Please enter style in correct format" })
            if (!isValidStyle(style.trim())) return res.status(400).send({ status: false, message: "Enter a proper style" })

            product.style = style
        }

        //create document
        const newProduct = await productModel.create(product)

        const result = {
            _id: newProduct._id,
            title: newProduct.title,
            description: newProduct.description,
            price: newProduct.price,
            currencyId: newProduct.currencyId,
            currencyFormat: newProduct.currencyFormat,
            isFreeShipping: newProduct.isFreeShipping,
            productImage: newProduct.productImage,
            style: newProduct.style,
            availableSizes: newProduct.availableSizes,
            installments: newProduct.installments,
            deletedAt: newProduct.deletedAt,
            isDeleted: newProduct.isDeleted,
            createdAt: newProduct.createdAt,
            updatedAt: newProduct.updatedAt
        }

        return res.status(201).send({ status: true, message: 'Success', data: result })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//------------------------------|| GET PRODUCT BY QUERY ||----------------------------------

const getProductByQuery = async (req, res) => {
    try {
        let requestQuery = req.query
        let filter = {}

        //size
        if (requestQuery.size == 0) {
            return res.status(400).send({ status: false, message: "provide something" })
        }

        if (requestQuery.size) {
            requestQuery.size = requestQuery.size.toUpperCase()

            let sizes = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL']

            let selectSize = requestQuery['size'].split(",")

            for (let i = 0; i < selectSize.length; i++) {
                if (!sizes.includes(selectSize[i])) return res.status(400).send({ status: false, message: "chooseSizeFromThat - S,XS,M,X,L,XXL,XL" })
            }

            filter.availableSizes = { $in: selectSize }
        }
        //name
        if (requestQuery.name == 0) {
            return res.status(400).send({ status: false, message: "it should not be empty" })
        }

        if (requestQuery.name) {
            if (!v.isValidName(requestQuery.name)) return res.status(400).send({ status: false, message: "Product not Found " })

            filter.title = { $regex: requestQuery.name, $options: "i" }
        }

        //priceGreterThan


        if (requestQuery.priceGreaterThan == 0) {
            return res.status(400).send({ status: false, message: "provide price and price should be in Number" })
        }


        if (requestQuery.priceGreaterThan) {
            filter.price = { $gt: requestQuery.priceGreaterThan }
        }

        // priceLessThan 
        if (requestQuery.priceLessThan == 0) {
            return res.status(400).send({ status: false, message: "provide price and price should be in Number" })
        }

        if (requestQuery.priceLessThan) {
            filter.price = { $lt: (requestQuery.priceLessThan) }
        }

        //priceGreterThan and priceLessThan
        if (requestQuery.priceGreaterThan && requestQuery.priceLessThan) {
            filter.price = { $lt: requestQuery.priceLessThan, $gt: requestQuery.priceGreaterThan }
        }

        if (requestQuery.priceSort == 0) {
            return res.status(400).send({ status: false, message: "provide something" })
        }

        let finallyGetProduct = await productModel.find({ $and: [filter, { isDeleted: false }] }).sort({ price: requestQuery.priceSort })

        if (finallyGetProduct.length === 0) {
            return res.status(400).send({ status: true, message: "nothing get" })
        }

        return res.status(200).send({ status: true, message: "Success", data: finallyGetProduct })
    }

    catch (err) {
        return res.status(500).send({ message: err.message, })
    }
}


//------------------------------|| GET PRODUCT BY PARAMS ||----------------------------------

const getProductByParams = async function (req, res) {     // COMPLETED
    try {
        let productId = req.params.productId
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: `${productId} is not valid productId` })

        let findProductData = await productModel.findById({ _id: productId })

        if (!findProductData) return res.status(404).send({ status: false, msg: `no data found by this ${productId} productId` })

        if (findProductData.isDeleted == true) return res.status(400).send({ status: false, msg: "this product is deleted" })

        return res.status(200).send({ status: true, message: "Success", data: findProductData })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//------------------------------|| UPDATE PRODUCT ||----------------------------------

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!v.isValidObjectId(productId)) return res.status(400).send({ status: false, msg: `${productId} is not valid productId` })

        let updateData = req.body
        let files = req.files

        if (!(v.isvalidRequest(updateData) || files)) return res.status(400).send({ status: false, msg: "please input some data to update" })

        if (v.isValidImg(files[0])) { return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" }); }

        let findProductData = await productModel.findById({ _id: productId })

        if (!findProductData) return res.status(404).send({ status: false, msg: `no data found by this ${productId} productId` })

        if (findProductData.isDeleted == true) return res.status(400).send({ status: false, msg: "this product is deleted so you can't update it" })

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage, deletedAt, isDeleted } = updateData

        for(let key in req.body){
            if(req.body[key].trim().length==0){
                return res.status(400).send({status:false, message:`${key} can't be empty`})
            }
        }


        if (title) {
            if (!isValidTitle(title.trim())) return res.status(400).send({ status: false, message: "Enter a proper title" })

            if (findProductData.title == title) return res.status(400).send({ status: false, msg: "title should be unique" })
        }

        if (description) {
            if (!description) return res.status(400).send({ status: false, msg: "enter valid description" })
        }

        if (price) {
            if (!isValidPrice(price.trim())) return res.status(400).send({ status: false, message: "Enter a proper price" })
        }

        if (currencyId) {
            if (currencyId !== "INR") return res.status(400).send({ status: false, msg: "enter valid currencyId in that formate INR" })
        }

        if (currencyFormat) {
            if (!isValid(currencyFormat)) return res.status(400).send({ status: false, message: "Please enter currencyFormat in correct format" })

            if (currencyFormat != '₹') return res.status(400).send({ status: false, message: "Please enter a valid currencyFormat in ₹ " })
        }

        if (isFreeShipping) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false"))

                return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping" })
        }

        if (files.length != 0) {
            let url = await uploadFile(files[0])
            updateData.productImage = url
        }

        if (style) {
            if (!isValidStyle(style)) return res.status(400).send({ status: false, msg: "enter valid style" })
        }

        if (availableSizes) {
            if (!isValidSizes(availableSizes.trim())) return res.status(400).send({ status: false, msg: "enter valid availableSizes from 'S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'" })
        }

        if (installments) {
            if (!(/^[0-9]+$/.test(installments.trim()))) return res.status(400).send({ status: false, message: "Invalid value for installments" })
        }

        if (isDeleted) {
            if (!(isDeleted == "true" || isDeleted == "false"))
                return res.status(400).send({ status: false, message: "Please enter a boolean value for isDeleted" })
        }

        let updatedProductData = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { ...updateData } }, { new: true })

        return res.status(200).send({ status: true, message: "Success", data: updatedProductData })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//------------------------------|| DELETE PRODUCT ||----------------------------------

const deleteProduct = async function (req, res) {    // COMPLETED
    try {
        let productId = req.params.productId
        if (!v.isValidObjectId(productId)) return res.status(400).send({ status: false, msg: `${productId} is not valid productId` })

        let ProductData = await productModel.findOne({ _id: productId })
        if (!ProductData) return res.status(404).send({ status: false, msg: `no data found by this ${productId} productId` })

        if (ProductData.isDeleted == true) return res.status(400).send({ status: false, msg: "this product is already deleted" })
        
        let deletedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });

        return res.status(200).send({ status: true, message: "Success", data: deletedProduct })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


//------------------------------|| EXPORTING MODULE TO ROUTE.JS ||----------------------------------

module.exports = { createProduct, getProductByQuery, getProductByParams, updateProduct, deleteProduct }


