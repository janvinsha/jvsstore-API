const multer = require('multer');
const sharp = require('sharp');
const Product = require('./../models/productModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
///
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadProductImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
//upload.single('image)req.file
//upload.array('images',6) req.files
exports.resizeProductImages = catchAsync(async (req, res, next) => {
  if (!req.files.image || !req.files.images) return next();
  //1)Cover image

  req.body.image = {
    name: `product-${req.params.id || ''}-${Date.now()}-cover.jpeg`,
    url: `${req.protocol}://${req.get('host')}/api/v1/uploads/product-${
      req.params.id || ''
    }-${Date.now()}-cover.jpeg`,
  };
  await sharp(req.files.image[0].buffer)
    .resize(2000, 2000)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`uploads/${req.body.image.name}`);

  //2)Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `product-${req.params.id || ''}-${Date.now()}-${
        i + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 2000)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`uploads/${filename}`);
      req.body.images.push({
        name: filename,
        url: `${req.protocol}://${req.get('host')}/api/v1/uploads/${filename}`,
      });
    })
  );

  next();
});
//
exports.aliasTopProducts = async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-rating,price';
  req.query.fields = 'name,price,rating';
  next();
};
exports.aliasTop3Products = async (req, res, next) => {
  req.query.limit = 3;
  req.query.sort = '-rating';
  next();
};

//get all Products
exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product, { path: 'reviews' });
exports.createProduct = factory.createOne(Product);
exports.editProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);

exports.getProductStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { ratingAverage: { $gte: 0 } },
    },
    {
      $group: {
        _id: null,
        numProducts: { $sum: 1 }, //number of products
        numRating: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$rating' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
 
  res.status(200).json({ status: 'Success', message: stats });
});

exports.getMontlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Product.aggregate([]);
  res.status(200).json({ status: 'success', data: { plan } });
});

// Product.create({
//   images: ['headSet2.jpg', 'headSet3.jpg', 'headSet4.jpg'],
//   ratingAverage: 5,
//   ratingQuantity: 0,
//   name: 'Highh quality headphones with bluetooth and aux availability',
//   category: 'headphones',
//   image: 'headSet1.jpg',
//   price: 10000,
//   productDetails:
//     'Headphones lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum',
//   rating: 4,
//   numReviews: 20,
//   countInStock: 100,
// });
