const mongoose = require('mongoose');

const ordersSchema = new mongoose.Schema(
  {
    orderItems:[ {
        product: {
            type: String,
            required: [true, 'Shipping address must have an address'],
          },
name: {
    type: String,
    required: [true, 'order must have a name'],
  },
price: {
    type: Number,
    required: [true, 'order must have a pricr'],
  },
countInStock: {
    type: Number,
    required: [true, 'order must have a count in stock'],
  },
qty: {
    type: Number,
    required: [true, 'order must have a quantity'],
  },
image:{name: {
    type: String,
    required: [true, 'order image must have a number'],
  },url: {
    type: String,
    required: [true, 'order image must have a url'],
  }}
    }],
  shippingAddress:{
      address: {
        type: String,
        required: [true, 'Shipping address must have an address'],
      },
      city: {
        type: String,
        required: [true, 'Shipping address must have a city'],
      },
      country: {
        type: String,
        required: [true, 'Shipping address must have a country'],
      },
      postalCode: {
        type: Number,
        required: [true, 'Shipping address must have a postal code'],
      }},
    paymentMethod: {
      type: String,
      required: [true, 'Order must have a payment method'],
   
    },
    itemsPrice: {
       type: Number, required: [true, 'Order must have items price'] 
    },
    taxPrice: {
        type: Number, required: [true, 'Order must have tax price'] 
     },
     shippingPrice: {
        type: Number, required: [true, 'Order must have shipping price'] 
     },
     totalPrice: {
        type: Number, required: [true, 'Order must have total price'] 
     },
     isPaid:{type:Boolean, default:false},
     isDelivered:{type:Boolean, default:false},
     paidAt:Date,
     deliveredAt:Date,
     paymentResults:{
        id:String,
        status:Boolean,
        update_time:Date,
        email_address:String
    }
     ,
     user:{   type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Order must contain a user'],},
    createdAt: { type: Date, default: Date.now(),},
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ordersSchema.pre(/^find/,function(next){
this.populate({path:"orderItems",
    select:"name photo price category"
}).populate({path:"user",select:"name photo email"})
next()
})

const Order = mongoose.model('Order', ordersSchema);
module.exports = Order;
