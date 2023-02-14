const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const v = require('../validations/validation')


const authentication = function (req, res, next) {
    try {
        const token = req.headers['authorization']
        if (typeof token == 'undefined' || typeof token == 'null') {
            return res.status(400).send({ status: false, msg: "Please Provide Token" })
        }

        let Token = token.split(" ").pop()

       jwt.verify(Token, "g60bhoramp",(error,decoded)=>{
             if (error) {
            return res.status(401).send({ status: false, message: error.message });
        } else {
            req.userId = decoded.userId
            next()
        }
        })
       
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

const authorisation = async function (req, res, next) {

    try {
        const UserIdInToken = req.userId 
        const userId = req.params.userId 
        if (userId) {
            if (!v.isValidObjectId(userId)) {
                return res.status(400).send({ status: false, message: "Please Enter Valid User Id" })
            }

            const User = await userModel.findById({ _id: userId })

            if (!User) return res.status(404).send({ status: false, message: "User Not Found" })
            if (userId !== UserIdInToken) return res.status(403).send({ status: false, message: "Access Denied" })

            next()
        }
    } catch (err) {
        return res.status(500).send({ msg: err.message })
    }

}


module.exports = { authentication, authorisation }

