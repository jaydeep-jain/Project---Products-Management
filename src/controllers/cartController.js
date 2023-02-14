const cartModel = require('../models/cartModel')
const v = require('../validations/validation')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')

//------------------------------|| CREATE CART ||----------------------------------

const createCart = async function (req, res) {
    try {
        let data = req.body
        if (!v.isvalidRequest(data)) {return res.status(400).send({ status: false, message: "Please Enter Data In Request Body" })}

        let userid = req.params.userId
        if (!v.isValidObjectId(userid)) return res.status(400).send({ status: false, message: "Please Enter Valid User Id" })

        let userExist = await userModel.findById(userid)
        if (!userExist) return res.status(404).send({ status: false, message:'User Not Exist'})

        let { productId, cartId } = data
        if (!v.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please Enter Valid productId" })
        
        let cartDataExist = await cartModel.findOne({ userId: userid })

        let productData = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productData) return res.status(404).send({ status: false, message:'no product found'})

        if (cartDataExist) {
            if (!cartId) return res.status(400).send({ status: false, message:'cart already created - enter valid cart id'})

            if (!v.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please Enter Valid cartId" })

            if (cartDataExist._id != cartId) {
                return res.status(400).send({ status: false, message: "cart isn't exist" })
            }
            let { items, totalItems, totalPrice } = cartDataExist
            
            let flag = true 

            for (let i in items) {
                if (items[i].productId == productId) {
                    items[i].quantity++
                    flag = false
                }
            }
            if (flag) {
                let obj = {
                    productId: productId,
                    quantity: 1
                }
                items.push(obj)
            }
            totalItems = items.length
            totalPrice += productData.price
            const updateItems = { items, totalItems, totalPrice }

            const updateCart = await cartModel.findByIdAndUpdate(cartId, { $set: updateItems }, { new: true }).populate("items.productId","title price productImage")

            return res.status(201).send({ status: true, message: "Success", data: updateCart })
        }
        else {

            let dataBlock = {
                userId: userid,
                items: [{
                    productId: productId,
                    quantity: 1
                }],
                totalItems: 1,
                totalPrice: productData.price
            }

            let createCart = await cartModel.create(dataBlock)

            let getCart = await cartModel.findById(createCart._id).populate("items.productId","title price productImage")

            return res.status(201).send({ status: true, message: 'Success', data: getCart })
        }


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

//------------------------------|| UPDATE CART ||----------------------------------

const updateCart = async function (req, res) {
    try {
        let data = req.body;
        let userId = req.params.userId;
        if (!v.isvalidRequest(data)) return res.status(400).send({ status: false, message: "Please Enter data" })
        
        let { cartId, productId, removeProduct } = data;
        
        if (!v.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please Enter Valid User Id" })
        
        let userExist = await userModel.findById(userId);
        if (!userExist) return res.status(404).send({ status: false, message: "User not Found" })

        if (!productId) return res.status(400).send({ status: false, message: "Please Enter Product Id" })
        if (!v.isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please Enter valid Product Id" })
        
        let product = await productModel.findById(productId);
        if (!product) return res.status(404).send({ status: false, message: "Product not found" })

        if (!(removeProduct || removeProduct == 0)) {
            return res.status(400).send({ status: false, message: "Provide the removeProduct Key" })
        }
        if (!(typeof removeProduct == "number")) {
            return res.status(400).send({ status: false, message: "RemoveProduct should be Number" })
        }
        if (!(removeProduct == 1 || removeProduct == 0))
            return res.status(400).send({ status: false, message: "Please Enter RemoveProduct Key 0 Or 1" })


        if (!cartId) return res.status(400).send({ status: false, message: "Please Enter Cart Id" })

        if (!v.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please Enter valid cart Id" })

        let cartExist = await cartModel.findById(cartId);

        let flag = false; //using flag variable 
        if (cartExist) {
            if (cartExist.items.length == 0) { return res.status(400).send({ status: false, message: "NO Items Present In Cart" }) }

            for (let i = 0; i < cartExist.items.length; i++) {
                if (cartExist.items[i].productId == productId && cartExist.items[i].quantity > 0) {
                    if (removeProduct == 1) 
                    {
                        cartExist.items[i].quantity -= 1;
                        cartExist.totalPrice -= product.price;

                        if (cartExist.items[i].quantity == 0) {
                            cartExist.items.splice(i, 1)
                        }
                    } else if (removeProduct == 0) {
                        cartExist.totalPrice = cartExist.totalPrice - cartExist.items[i].quantity * product.price;
                        cartExist.items.splice(i, 1)
                    }

                    flag = true;
                    //updating the cart data 
                    cartExist.totalItems = cartExist.items.length;
                    let final = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: cartExist }, { new: true })
                    return res.status(200).send({ status: true, message: "Success", data: final });
                }
            }
            if (flag == false) {
                return res.status(404).send({ status: false, message: "No Product with this productId" })
            }
        } else { return res.status(404).send({ status: false, message: "Cart Not Found With This CartId" }) }
    } catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

//------------------------------|| GET CART ||----------------------------------

const getCartDetails = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!v.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `${userId} is not valid userid` })
        let findUserData = await userModel.findById({ _id: userId })
        if (!findUserData) return res.status(400).send({ status: false, message: `no user found by this ${userId}` })
        const data = await cartModel.findOne({ userId }).populate('items.productId')
        if (!data) return res.status(404).send({ status: false, message: "no data exist" })
        return res.status(200).send({ status: true, message: 'Success', data: data })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

//------------------------------|| DELETE CART ||----------------------------------

const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!v.isValidObjectId(userId)) return res.status(400).send({ status: false, message: `${userId} is not valid userid` })
        let findUserData = await userModel.findById({ _id: userId })
        if (!findUserData) return res.status(400).send({ status: false, message: `no user found by this ${userId}` })
        const cartdata = await cartModel.findOne({ userId })
        if (!cartdata) return res.status(404).send({ status: false, message: "no data exist" })

        const updateData = { items: [], totalPrice: 0, totalItems: 0 }
        const data = await cartModel.findOneAndUpdate({ userId }, updateData, { new: true })
        return res.status(201).send({ status: true, message: "Success", data: data })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}

module.exports = { createCart, updateCart, getCartDetails, deleteCart }