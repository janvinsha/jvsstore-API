const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const Order = require('./../models/orderModel');
const factory = require('./handlerFactory');

exports.getAllOrders = factory.getAll(Order);
exports.setOrderUserId = (req, res, next) => {
    //Allowed nested routes
    if (!req.body.user) req.body.user = req.user.id;
    next();
  };

  const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };
  
  exports.setIsPaid = (req, res, next) => {
    //Allowed nested routes
    if (!req.body.isPaid) req.body.isPaid = true;
    req.body.paidAt = Date.now();

    const filteredBody = filterObj(req.body, 
        'isPaid','paidAt');
    req.body=filteredBody
    next();
  };
  exports.setIsDelivered = (req, res, next) => {
    //Allowed nested routes
    if (!req.body.isDelivered) req.body.isDelivered = true;
    req.body.deliveredAt = Date.now();

    const filteredBody = filterObj(req.body, 
        'isDelivered','deliveredAt');
    req.body=filteredBody
    next();
  };


exports.getOrder = factory.getOne(Order);
exports.createOrder = factory.createOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.deleteOrder = factory.deleteOne(Order);
