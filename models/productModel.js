const mongoose = require('mongoose');
const slugify = require('slugify');
const productsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product must have a name'],
      trim: true,
    },
    slug: String,
    category: {
      type: String,
      required: [true, 'Product must have a category'],
      trim: true,
    },
    image: {
      name: { type: String,},
      url: { type: String,},
    },
    images: [{ name: String, url: String }],
    price: { type: Number, required: [true, 'Product must have a price'] },
    slashedPrice: Number,
    ratingAverage: {
      type: Number,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
      default: 4.5,
      set: (val) => Math.round(val * 10) / 10, //4.6666,46.666,47,4.7
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    secretProduct: Boolean,
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
  
    countInStock: {type:Number,  required: [true, 'Count in stock is required'],},
    createdAt: { type: Date, default: Date.now(), select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
productsSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

productsSchema.index({ price: 1, ratingAverage: 1 });
//Virtual populate
productsSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});
// productsSchema.virtual('durationWeeks').get(function () {
//   return this.duration / 7;
// });

// productsSchema.pre('save', function (next) {
//   next();
// });
//DOCUMENT MIDDLEWARE runs before  .save() ande .create()
// productsSchema.pre('save', function (next) {
//   console.log(this);
// });
// productsSchema.post('save', function (doc,   next) {
//   console.log(this);
// });

// QUERY MIDDLEWARE
productsSchema.pre(/^find/, function (next) {
  this.find({
    secretProduct: { $ne: true },
  });

  next();
});
// productsSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
// });

//AGGREGATION MIDDLEWARE
// productsSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretProduct: { $ne: true } },
//   });

//   console.log(this.pipeline());
// });
const Product = mongoose.model('Product', productsSchema);

module.exports = Product;
