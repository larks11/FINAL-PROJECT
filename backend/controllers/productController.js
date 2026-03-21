import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';
import Request from '../models/requestModel.js';
import Order from '../models/orderModel.js';

const getProducts = asyncHandler(async (req, res) => {
  const pageSize = process.env.PAGINATION_LIMIT;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    return res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    image: '/images/sample.jpg',
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});


const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();

    if (Number(countInStock) > 0) {
      await Request.updateMany(
        { product: product._id, status: 'pending' },
        { status: 'available' }
      );
    }

    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});


const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});


const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'orderItems.product': product._id,
    });

    if (!hasPurchased) {
      res.status(403);
      throw new Error('You can only review products you have ordered');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);
  res.json(products);
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const products = await Product.find({ category: req.params.category });
  res.json(products);
});

const checkUserOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    user: req.user._id,
    'orderItems.product': req.params.id,
  });
  res.json({ hasPurchased: !!order });
});

const requestProduct = asyncHandler(async (req, res) => {
  const { productId, productName, message } = req.body;

  const request = new Request({
    user: req.user._id,
    product: productId || null,
    productName,
    message: message || '',
  });

  const createdRequest = await request.save();
  res.status(201).json(createdRequest);
});

const getRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({})
    .populate('user', 'name email')
    .populate('product', 'name image countInStock')
    .sort({ createdAt: -1 });

  res.json(requests);
});

const markRequestRead = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (request) {
    request.isRead = true;
    await request.save();
    res.json({ message: 'Marked as read' });
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Request.countDocuments({ isRead: false });
  res.json({ count });
});

const deleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (request) {
    await Request.deleteOne({ _id: request._id });
    res.json({ message: 'Request removed' });
  } else {
    res.status(404);
    throw new Error('Request not found');
  }
});

const deleteAllRequests = asyncHandler(async (req, res) => {
  await Request.deleteMany({});
  res.json({ message: 'All requests removed' });
});

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getProductsByCategory,
  checkUserOrder,
  requestProduct,
  getRequests,
  markRequestRead,
  getUnreadCount,
  deleteRequest,
  deleteAllRequests
};