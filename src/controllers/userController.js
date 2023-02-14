const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const v = require('../validations/validation')
const { uploadFile } = require('../aws/aws')
const bcrypt = require("bcrypt")

const userCreate = async function (req, res) {
   try {
      let data = req.body
      if (!v.isvalidRequest(data)) return res.status(400).send({ status: false, message: `data is mandatory` })

      let { fname, lname, email, phone, password, address } = data

      let files = req.files

      if (files.length == 0) return res.status(400).send({ status: false, message: "profileImage is mandatory" })

      if (files && files.length > 0) {
         if (!(v.isValidImg(files[0].mimetype))) { return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" }); }

         var photolink = await uploadFile(files[0])
      }

      if (!v.isValidSpace(fname)) return res.status(400).send({ status: false, message: `fname is mandatory` })

      if (!v.isValidName(fname)) return res.status(400).send({ status: false, message: `fname is must in char` })

      if (!v.isValidSpace(lname)) return res.status(400).send({ status: false, message: `lname is mandatory` })

      if (!v.isValidName(lname)) return res.status(400).send({ status: false, message: `lname is must in char` })

      if (!v.isValidSpace(email)) return res.status(400).send({ status: false, message: `email is mandatory` })

      if (!v.isValidEmail(email)) return res.status(400).send({ status: false, message: `email is in valid format` })

      if (await userModel.findOne({ email: email })) return res.status(400).send({ status: false, message: `email already exist` })

      if (!v.isValidSpace(phone)) return res.status(400).send({ status: false, message: `phone is mandatory` })

      if (!v.isValidMobile(phone)) return res.status(400).send({ status: false, message: `enter a valid phone number` })

      if (await userModel.findOne({ phone: phone })) return res.status(400).send({ status: false, message: `phone already exist` })

      if (!v.isValidSpace(password)) return res.status(400).send({ status: false, message: `password is mandatory` })

      if (!v.isValidPass(password)) return res.status(400).send({ status: false, message: `enter a valid password-"password length should be 8 min - 15 max"` })

      //address
      if (!v.isValidSpace(address)) { return res.status(400).send({ status: false, message: "Please provide your address" }) }

      if (address) {

         data.address = JSON.parse(address)

         if (data.address.shipping) {
            if (!(typeof data.address.shipping === 'object')) return res.status(400).send({ status: false, message: 'address should be in object' })

            if (!data.address.shipping.street) return res.status(400).send({ status: true, message: "Shipping Street address is required" })

            if (!v.isValidSpace(data.address.shipping.city)) return res.status(400).send({ status: true, message: "Shipping  City is required" })

            if (!v.isValidSpace(data.address.shipping.pincode)) return res.status(400).send({ status: true, message: "Shipping Pincode is required" })

            if (!v.isvalidPincode(data.address.shipping.pincode)) return res.status(400).send({ status: false, message: "Shipping Please provide pincode in 6 digit number" })

         } else { return res.status(400).send({ status: true, message: " Shipping address is required" }) }

         if (data.address.billing) {
            if (!(v.isValidSpace(data.address.billing.street))) return res.status(400).send({ status: true, message: "billing street address is required" })

            if (!(v.isValidSpace(data.address.billing.city))) return res.status(400).send({ status: true, message: "billing city is required" })

            if (!data.address.billing.pincode) return res.status(400).send({ status: true, message: " billing pincode is required" })

            if (!(v.isvalidPincode(data.address.billing.pincode))) return res.status(400).send({ status: false, message: "please provide billing pincode in 6 digit number" })

         } else { return res.status(400).send({ status: false, message: " billing address is required" }) }
      }
      //hashing 
      const salt = await bcrypt.genSalt(10)

      const hashpass = await bcrypt.hash(data.password, salt)


      data.password = hashpass
      // data.address = JSON.parse(data.address)
      data.profileImage = photolink
      let userData = await userModel.create(data)
      return res.status(201).send({ status: true, message: 'Success', data: userData })
   }
   catch (err) {
      return res.status(500).send({ status: false, message: err.message })
   }
}











const userLogin = async function (req, res) {
   try {
      const requestBody = req.body
      if (!v.isvalidRequest(requestBody)) return res.status(400).send({ status: false, message: `data is mandatory` })

      const { email, password } = requestBody

      if (!email) return res.status(400).send({ status: false, message: "please provide email" })
      if (!v.isValidEmail(email)) return res.status(400).send({ status: false, message: "email is not valid" })

      if (!password) return res.status(400).send({ status: false, message: "please provide password" })
      if (!v.isValidPass(password)) return res.status(400).send({ status: false, message: `enter a valid password-"password length should be 8 min - 15 max"` })

      let user = await userModel.findOne({ email: email });

      if (!user) return res.status(404).send({ status: false, message: "no user found-invalid user" });

      let passCheck = await bcrypt.compare(password, user.password)
      if (!passCheck) return res.status(400).send({ status: false, message: "invalid password" });

      //tokengeneration
      let token = jwt.sign({
         userId: user._id.toString(),
      },
         "g60bhoramp",
         { expiresIn: "60min" }
      );

      let userId = user._id
      return res.send({ status: true, message: "Success", data: { userId, token } });

   } catch (error) {
      return res.status(500).send({ status: false, message: error.message })
   }
}






// get param api
const getUserDetails = async function (req, res) {
   try {
      let userIdByparams = req.params.userId

      if (!v.isValidObjectId(userIdByparams)) return res.status(400).send({ status: false, message: `${userIdByparams} is not valid userId` })

      let findUserData = await userModel.findById({ _id: userIdByparams })
      return res.status(200).send({ status: true, message: "User profile details", data: findUserData })

   } catch (err) {
      console.log(err.message)
      return res.status(500).send({ status: false, message: err.message })
   }

}




// update user  

const updateUser = async function (req, res) {
   try {
      const { userId } = req.params
      let data = req.body
      const files = req.files
         
      if (!(v.isvalidRequest(data)|| files)) return res.status(400).send({ status: false, message: "please Enter data inside request body" })

      let updateData = {}

      const { fname, lname, email, phone, password,profileImage, address } = data
      
      for(let key in req.body){
         if(req.body[key].trim().length==0){
             return res.status(400).send({status:false, message:`${key} can't be empty`})
         }
      }
      
      if (files.length != 0) {
         const uploadedFileURL = await uploadFile(files[0])
         if (!(v.isValidImg(files[0].mimetype))) { return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" }); }

         updateData['profileImage'] = uploadedFileURL;
      }

      if (fname) {
         if (!v.isValidName(fname)) {
            return res.status(400).send({ status: false, message: "fname should be in character" });
         }
         updateData['fname'] = fname
      }

      if (lname) {
         if (!v.isValidName(lname)) return res.status(400).send({ status: false, message: "lname should be in character" })
         updateData['lname'] = lname
      }

      if (email) {
         if (!v.isValidEmail(email)) return res.status(400).send({ status: false, message: "Provide Email in Proper format" })
         const ExistEmail = await userModel.findOne({ email: email })
         if (ExistEmail) return res.status(400).send({ status: false, message: 'give another email to update' })

         updateData['email'] = email
      }

      if (phone) {
         if (!v.isValidMobile(phone)) return res.status(400).send({ status: false, message: "Provide Phone number in Proper format" })
         const ExistPhone = await userModel.findOne({ phone: phone })
         if (ExistPhone)return  res.status(400).send({ status: false, message: 'give another phone to update' })

         updateData['phone'] = phone
      }

      if (password) {
         if (!v.isValidPass(password)) return res.status(400).send({ status: false, message: "Enter password in valid format " })
         const salt = await bcrypt.genSalt(10)
         const hashed = await bcrypt.hash(password, salt)
         
         updateData['password'] = hashed
      }

      if (address) {
         address = JSON.parse(address)
         if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please Enter the address in object form" })
         if (address.shipping) {
            let { street, city, pincode } = address.shipping
            if (street) {
               if (!v.isValidString(street)) return res.status(400).send({ status: false, message: "Please Enter valid Street" })
               address['shipping.street'] = street
            }
            if (city) {
               if (!v.isValidString(city)) return res.status(400).send({ status: flase, message: "Please Enter valid city" })
               address['shipping.city'] = city
            }
            if (pincode) {
               if (!v.isvalidPincode(pincode)) return res.status(400).send({ status: false, message: "Please Enter Six digit Pincode" })
               address['shipping.pincode'] = pincode
            }
         }

         if (address.billing) {
            let { street, city, pincode } = address.billing
            if (street) {
               if (!v.isValidString(street)) return res.status(400).send({ status: false, message: "Please Enter valid Street" })
               address['billing.street'] = street
            }
            if (city) {
               if (!v.isValidString(city)) return res.status(400).send({ status: false, message: "Please Enter valid city" })
               address['billing.city'] = city
            }
            if (pincode) {
               if (!v.isvalidPincode(pincode)) return res.status(400).send({ status: false, message: "Please Enter Six digit Pincode" })
               address['billing.pincode'] = pincode
            }
         }
         updateData[address] = address
      }

      const updateduserprofile = await userModel.findOneAndUpdate({ _id: userId }, updateData, { new: true })
      return res.status(200).send({ status: true, message: "Success", data: updateduserprofile })

   }
   catch (err) {
      return res.status(500).send({ status: false, message: err.message })
   }
}

module.exports = { userCreate, getUserDetails, userLogin, updateUser }





