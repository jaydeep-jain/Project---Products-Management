const orderModel = require('../models/orderModel')
const userModel = require('../models/userModel')
const v = require('../validations/validation')
const cartModel = require('../models/cartModel')


//------------------------------|| CREATE ORDER ||----------------------------------
const createOrder = async function (req, res) {
    try {
      let userId = req.params.userId;
      let data = req.body;
      if (!v.isValidObjectId(userId))
        return res.status(400).send({ status: false, message: "invalid userId" });
  
      let User = await userModel.findOne({ _id: userId });
  
      if (!User) {
        return res.status(404).send({ status: false, message: "NO User Found" });
      }
      let { cartId, cancellable, status } = data;
  console.log(data)
  
      if (!v.isvalidRequest(data)) {return res.status(400).send({ status: false, message: "Please Enter Data In Request Body" })}
  
      data["userId"] = userId;
  
      if (!v.isValidSpace(cartId)) { return res.status(400).send({ status: "false", message: "Please Enter cartId" })}
  
      if (!v.isValidObjectId(cartId)) { return res.status(400).send({ status: "false", message: "invalid cartId" })}
  
      let CartExist = await cartModel.findOne({ userId:userId, _id:cartId })
  
      if (!CartExist) {return res.status(404).send({ status: false, message: "No Cart Found" })}
  
      if (!v.isValidString(cancellable)) { return res.status(400).send({ status: false, message: "enter true or false" })}

      if (cancellable) {
        if (!(cancellable == true || cancellable == false)) return res.status(400).send({ status: false, message: "cancellable  contain only boolean value" })}
  
      if (!v.isValidString(status)) { return res.status(400).send({ status: false, message: "Please Enter The Status" })}
  
      if (status) { if (!["pending", "completed", "cancelled"].includes(status))
      { return res.status(400).send({ status: false, message: "it can contain only [pending, completed, cancelled] values"})}}
  
      let ExistCartData = await cartModel.findById(cartId)
  
      data.items = ExistCartData.items;
      data.totalPrice = ExistCartData.totalPrice;
      data.totalItems = ExistCartData.totalItems;
  
      let totalQuantity = 0;

      for (let i = 0; i < ExistCartData.items.length; i++) {
        totalQuantity += ExistCartData.items[i].quantity }
        data.totalQuantity = totalQuantity;
  
      const orderdata = await orderModel.create(data);
  
      await cartModel.findOneAndUpdate( { _id: cartId, userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 }})

      return res.status(201).send({ status: true, message: "Success", data: orderdata })
    } catch (err) {
      return res.status(500).send({ status: false, error: err.message });
    }
  }

//------------------------------|| UPDATE ORDER ||----------------------------------

const updateOrder = async function (req, res) {
  try {
    let paramUserID = req.params.userId;

    if (!v.isValidObjectId(paramUserID))
      return res.status(400).send({ status: false, message: "invalid userId" });

    let requestBody = req.body;

    if (!v.isvalidRequest(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "Please Enter Data In Request Body" });
    }

    let { orderId, status } = requestBody;

    if (status) { if (!["pending", "completed", "cancelled"].includes(status)){ 
      return res.status(400).send({ status: false, message: "it can contain only [pending, completed, cancelled] values"})}}
  

    let checkUser = await userModel.findById(paramUserID);

    if (!checkUser) {
      return res
        .status(404)
        .send({ status: false, message: " user not found" });
    }

    const checkOrder = await orderModel.findOne({
      _id: orderId,
      userId: paramUserID,
    });
    if (!checkOrder) {
      return res
        .status(404)
        .send({ status: false, message: "order not found from that id" });
    }

    if ((checkOrder.cancellable = false)) {
      return res
        .status(404)
        .send({ status: false, message: "order  cancelled" });
    }

    if (checkOrder.status == "cancelled") {
      return res
        .status(404)
        .send({ status: false, message: " allready  cancelled" });
    }

    if (checkOrder.status == "completed") {
      return res
        .status(404)
        .send({ status: false, message: " allready  completed" });
    }

    let finallyUpdatedOrder;

    if (status == "cancelled") {
      finallyUpdatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: "cancelled" },
        { new: true }
      );
    }

    if (status == "completed") {
     finallyUpdatedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: "completed" },
        { new: true }
      );
    }

    return res.status(200).send({status: true,message: "Success",data: finallyUpdatedOrder});
 
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {createOrder, updateOrder}








