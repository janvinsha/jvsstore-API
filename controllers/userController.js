const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const User = require('./../models/userModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, '/uploads');
//   },
//   filename: (req, file, cb) => {
//     //user-67547574ddf-43435353.jpeg user-userid-timestamp
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.diskStorage({ destination: (req, file, cb) => {
      cb(null, 'uploads');
    },});
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
exports.uploadUserPhoto = upload.single('photo');
// exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
//   if (!req.file) return next();
//   req.body.photo = {
//     name:`user-${req.user.id}.jpeg`,
//     url: `${req.protocol}://${req.get('host')}/api/v1/uploads/user-${req.user.id}.jpeg`
//   };
//   await sharp(req.file.buffer)
//     .resize(500, 500)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`uploads/${req.body.photo.name}`);
//   next();
// });
cloudinary.config({ 
  cloud_name: process.env.CLOUD_STORAGE_NAME, 
  api_key: process.env.CLOUD_STORAGE_API_KEY, 
  api_secret:  process.env.CLOUD_STORAGE_API_SECRET
});

exports.uploadPhoto= catchAsync(async (req, res, next) => {
  if (!req.file) return next();
const uploadResponse=await cloudinary.uploader.upload(
  req.file.path,{upload_preset:'jvsstore', width: 500, height: 500,gravity: "face",  crop: "fill"}
)
console.log(req.file.photo);
  req.body.photo = {
    name:uploadResponse.original_filename,
    url: uploadResponse.url
  };
next()
})

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)Create error if user posts password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }
  //2)Filter out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email','photo');
  //3)Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'Success',
    data: updatedUser,
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getUser = factory.getOne(User, {
  path: 'orders',options:{sort:'-createdAt'}
});

exports.getLoggedInUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: 
      user
  });
});
//do not attempt to change user password here
//just for admin cause the user can already change his information
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
