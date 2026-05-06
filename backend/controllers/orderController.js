import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Request from '../models/requestModel.js';
import { calcPrices } from '../utils/calcPrices.js';
import { verifyPayPalPayment, checkIfNewTransaction } from '../utils/paypal.js';

// ── Helper: get delivery hours based on destination city ────────────────────
const getDeliveryHours = (city = '') => {
  const c = city.toLowerCase();

  // Ormoc → nearby Leyte / Samar (~same day to 1 day)
  const nearbyLeyte = [
    'ormoc', 'tacloban', 'palo', 'tanauan', 'tolosa',
    'dulag', 'abuyog', 'baybay', 'maasin', 'burauen',
    'carigara', 'naval', 'catbalogan', 'calbayog',
  ];

  // Ormoc → Cebu / nearby Visayas (~1.5–2 days)
  const nearbyVisayas = [
    'cebu', 'mandaue', 'lapu-lapu', 'lapulapu', 'talisay',
    'danao', 'toledo', 'bogo', 'iloilo', 'bacolod',
    'dumaguete', 'tagbilaran', 'boracay', 'roxas',
  ];

  if (nearbyLeyte.some((k) => c.includes(k))) {
    // 12–24 hours
    return { inTransit: 1, outForDelivery: 10, delivered: 20 };
  }
  if (nearbyVisayas.some((k) => c.includes(k))) {
    // ~2 days
    return { inTransit: 2, outForDelivery: 36, delivered: 46 };
  }
  // Default: Luzon / Manila (~3–4 days)
  return { inTransit: 3, outForDelivery: 80, delivered: 92 };
};

// ── EXISTING: Add order items ────────────────────────────────────────────────
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const itemsFromDB = await Product.find({
      _id: { $in: orderItems.map((x) => x._id) },
    });

    for (const itemFromClient of orderItems) {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB._id.toString() === itemFromClient._id
      );
      if (matchingItemFromDB.countInStock < itemFromClient.qty) {
        res.status(400);
        throw new Error(`Not enough stock for ${matchingItemFromDB.name}`);
      }
    }

    const dbOrderItems = orderItems.map((itemFromClient) => {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB._id.toString() === itemFromClient._id
      );
      return {
        ...itemFromClient,
        product: itemFromClient._id,
        price: matchingItemFromDB.price,
        _id: undefined,
      };
    });

    const { itemsPrice, taxPrice, shippingPrice, totalPrice } =
      calcPrices(dbOrderItems);

    const order = new Order({
      orderItems: dbOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: true,
      paidAt: Date.now(),
      isDelivered: false,
      orderStatus: 'Order Created',
      statusHistory: [
        {
          status: 'Order Created',
          timestamp: new Date(),
          note: 'Ormoc City Main Branch',
        },
      ],
    });

    const createdOrder = await order.save();

    for (const itemFromClient of orderItems) {
      await Product.findByIdAndUpdate(itemFromClient._id, {
        $inc: { countInStock: -itemFromClient.qty },
      });
    }

    await Request.create({
      user: req.user._id,
      productName: `ORDER #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
      message: `New order placed! Items: ${dbOrderItems
        .map((i) => `${i.name} x${i.qty}`)
        .join(', ')}. Total: ₱${totalPrice.toLocaleString('en-PH')}`,
      status: 'pending',
      isRead: false,
    });

    res.status(201).json(createdOrder);
  }
});

// ── EXISTING: Get my orders ──────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// ── EXISTING: Get order by ID ────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// ── EXISTING: Update order to paid ──────────────────────────────────────────
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const { verified, value } = await verifyPayPalPayment(req.body.id);
  if (!verified) throw new Error('Payment not verified');

  const isNewTransaction = await checkIfNewTransaction(Order, req.body.id);
  if (!isNewTransaction) throw new Error('Transaction has been used before');

  const order = await Order.findById(req.params.id);

  if (order) {
    const paidCorrectAmount = order.totalPrice.toString() === value;
    if (!paidCorrectAmount) throw new Error('Incorrect amount paid');

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// ── EXISTING: Update order to delivered (kept for compatibility) ─────────────
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'Delivered';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// ── NEW: Admin prepares the order ────────────────────────────────────────────
const prepareOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.orderStatus !== 'Order Created') {
    res.status(400);
    throw new Error('Order is not in "Order Created" status');
  }

  order.orderStatus = 'Preparing';
  order.preparedAt = new Date();
  order.statusHistory.push({
    status: 'Preparing',
    timestamp: new Date(),
    note: 'CELLCOM Ormoc Warehouse',
  });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// ── NEW: Admin marks order as picked up → triggers auto-progression ──────────
const pickupOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.orderStatus !== 'Preparing') {
    res.status(400);
    throw new Error('Order must be in "Preparing" status before pickup');
  }

  const now = new Date();
  const city = order.shippingAddress.city;
  const hours = getDeliveryHours(city);

  const inTransitTime    = new Date(now.getTime() + hours.inTransit        * 60 * 60 * 1000);
  const outForDeliveryTime = new Date(now.getTime() + hours.outForDelivery * 60 * 60 * 1000);
  const deliveredTime    = new Date(now.getTime() + hours.delivered        * 60 * 60 * 1000);

  order.orderStatus  = 'Picked Up';
  order.pickedUpAt   = now;
  order.inTransitAt       = inTransitTime;
  order.outForDeliveryAt  = outForDeliveryTime;
  order.deliveredAt       = deliveredTime;   // estimated; will be overwritten when truly delivered
  order.isDelivered       = false;

  order.statusHistory.push({
    status: 'Picked Up',
    timestamp: now,
    note: 'Ormoc City Courier',
  });

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// ── NEW: Cron / scheduled check — advance auto statuses ─────────────────────
// Call this from a setInterval or a cron job in server.js
// e.g.  setInterval(advanceOrderStatuses, 5 * 60 * 1000);  // every 5 min
const advanceOrderStatuses = async () => {
  const now = new Date();

  // Orders that have been picked up but not yet delivered/cancelled
  const orders = await Order.find({
    orderStatus: { $in: ['Picked Up', 'In Transit', 'Out for Delivery'] },
    isCancelled: false,
    isDelivered: false,
  });

  for (const order of orders) {
    let changed = false;

    if (order.orderStatus === 'Picked Up' && order.inTransitAt && now >= order.inTransitAt) {
      order.orderStatus = 'In Transit';
      order.statusHistory.push({
        status: 'In Transit',
        timestamp: order.inTransitAt,
        note: 'Ormoc Distribution Hub',
      });
      changed = true;
    }

    if (
      (order.orderStatus === 'In Transit' || changed) &&
      order.outForDeliveryAt &&
      now >= order.outForDeliveryAt
    ) {
      order.orderStatus = 'Out for Delivery';
      order.statusHistory.push({
        status: 'Out for Delivery',
        timestamp: order.outForDeliveryAt,
        note: `${order.shippingAddress.city} Delivery Hub`,
      });
      changed = true;
    }

    if (
      (order.orderStatus === 'Out for Delivery' || changed) &&
      order.deliveredAt &&
      now >= order.deliveredAt
    ) {
      order.orderStatus = 'Delivered';
      order.isDelivered = true;
      order.deliveredAt = now;
      order.statusHistory.push({
        status: 'Delivered',
        timestamp: now,
        note: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
      });
      changed = true;
    }

    if (changed) await order.save();
  }
};

// ── EXISTING: Cancel order ───────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    if (order.isCancelled) {
      res.status(400);
      throw new Error('Order is already cancelled');
    }
    if (order.isDelivered) {
      res.status(400);
      throw new Error('Cannot cancel a delivered order');
    }

    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.qty },
      });
    }

    order.isCancelled    = true;
    order.cancelledAt    = Date.now();
    order.cancelReason   = reason || 'Cancelled by user';
    order.orderStatus    = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled by user',
    });

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// ── EXISTING: Get all orders (admin) ────────────────────────────────────────
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});

// ── EXISTING: Delete order ───────────────────────────────────────────────────
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    await Order.deleteOne({ _id: order._id });
    res.json({ message: 'Order removed' });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  prepareOrder,
  pickupOrder,
  advanceOrderStatuses,
  cancelOrder,
  getOrders,
  deleteOrder,
};