import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Request from '../models/requestModel.js';
import Settings from '../models/settingsModel.js';
import { calcPrices } from '../utils/calcPrices.js';
import { verifyPayPalPayment, checkIfNewTransaction } from '../utils/paypal.js';

const getDeliveryHours = (city = '') => {
  const c = city.toLowerCase();
  const nearbyLeyte = ['ormoc','tacloban','palo','tanauan','tolosa','dulag','abuyog','baybay','maasin','burauen','carigara','naval','catbalogan','calbayog'];
  const nearbyVisayas = ['cebu','mandaue','lapu-lapu','lapulapu','talisay','danao','toledo','bogo','iloilo','bacolod','dumaguete','tagbilaran','boracay','roxas'];
  if (nearbyLeyte.some((k) => c.includes(k))) return { inTransit: 1, outForDelivery: 10, delivered: 20 };
  if (nearbyVisayas.some((k) => c.includes(k))) return { inTransit: 2, outForDelivery: 36, delivered: 46 };
  return { inTransit: 3, outForDelivery: 80, delivered: 92 };
};

const getETADaysRange = (city = '') => {
  const c = city.toLowerCase();
  const nearbyLeyte = ['ormoc','tacloban','palo','tanauan','tolosa','dulag','abuyog','baybay','burauen','carigara','naval'];
  const visayas = ['cebu','mandaue','lapu-lapu','lapulapu','talisay','iloilo','bacolod','dumaguete','tagbilaran'];
  const mindanao = ['davao','cagayan de oro','zamboanga','general santos','butuan','iligan','cotabato'];
  const luzon = ['manila','quezon','makati','pasig','taguig','pasay','caloocan','mandaluyong','marikina','paranaque','baguio','olongapo','angeles','naga','legazpi'];
  if (nearbyLeyte.some((k) => c.includes(k))) return { min: 1, max: 3 };
  if (visayas.some((k) => c.includes(k))) return { min: 2, max: 4 };
  if (mindanao.some((k) => c.includes(k))) return { min: 3, max: 6 };
  if (luzon.some((k) => c.includes(k))) return { min: 5, max: 8 };
  return { min: 3, max: 7 };
};

const addBusinessDays = (date, days) => {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
};

// ── ADD ORDER — reserve stock lang, dili pa i-deduct ang countInStock ─────────
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const itemsFromDB = await Product.find({ _id: { $in: orderItems.map((x) => x._id) } });

  for (const itemFromClient of orderItems) {
    const match = itemsFromDB.find((i) => i._id.toString() === itemFromClient._id);
    const available = match.countInStock - (match.reservedStock || 0);
    if (available < itemFromClient.qty) {
      res.status(400);
      throw new Error(`Not enough available stock for ${match.name}. Available: ${available}`);
    }
  }

  const dbOrderItems = orderItems.map((itemFromClient) => {
    const match = itemsFromDB.find((i) => i._id.toString() === itemFromClient._id);
    return { ...itemFromClient, product: itemFromClient._id, price: match.price, _id: undefined };
  });

  // ✅ Reserve stock — increment reservedStock ONLY, dili pa i-deduct countInStock
  for (const item of dbOrderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { reservedStock: item.qty },
    });
  }

  let settings = await Settings.findOne({});
  if (!settings) settings = await Settings.create({});

  const { itemsPrice, taxPrice, shippingPrice, totalPrice } = calcPrices(
    dbOrderItems,
    shippingAddress.city,
    shippingAddress.country,
    settings.shippingFees,
    settings.vatRate,
  );

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
    statusHistory: [{ status: 'Order Created', timestamp: new Date(), note: 'Ormoc City Main Branch' }],
  });

  const createdOrder = await order.save();

  const { min, max } = getETADaysRange(shippingAddress.city);
  createdOrder.etaStart = addBusinessDays(new Date(), min);
  createdOrder.etaEnd = addBusinessDays(new Date(), max);
  await createdOrder.save();

  await Request.create({
    user: req.user._id,
    productName: `ORDER #${createdOrder._id.toString().slice(-6).toUpperCase()}`,
    message: `New order placed! Items: ${dbOrderItems.map((i) => `${i.name} x${i.qty}`).join(', ')}. Total: ₱${totalPrice.toLocaleString('en-PH')}`,
    status: 'pending',
    isRead: false,
  });

  res.status(201).json(createdOrder);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) res.json(order);
  else { res.status(404); throw new Error('Order not found'); }
});

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
  } else { res.status(404); throw new Error('Order not found'); }
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'Delivered';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else { res.status(404); throw new Error('Order not found'); }
});

const prepareOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.orderStatus !== 'Order Created') { res.status(400); throw new Error('Order is not in "Order Created" status'); }
  order.orderStatus = 'Preparing';
  order.preparedAt = new Date();
  order.statusHistory.push({ status: 'Preparing', timestamp: new Date(), note: 'CELLCOM Ormoc Warehouse' });
  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// ✅ Pag Pickup — DILI pa i-deduct ang countInStock, mag-huwat sa "In Transit"
const pickupOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.orderStatus !== 'Preparing') { res.status(400); throw new Error('Order must be in "Preparing" status before pickup'); }

  const now = new Date();
  const hours = getDeliveryHours(order.shippingAddress.city);

  order.orderStatus = 'Picked Up';
  order.pickedUpAt = now;
  order.inTransitAt = new Date(now.getTime() + hours.inTransit * 3600000);
  order.outForDeliveryAt = new Date(now.getTime() + hours.outForDelivery * 3600000);
  order.deliveredAt = new Date(now.getTime() + hours.delivered * 3600000);
  order.isDelivered = false;
  order.statusHistory.push({ status: 'Picked Up', timestamp: now, note: 'Ormoc City Courier' });

  // ✅ DILI pa i-deduct diri — mag-huwat sa advanceOrderStatuses kung "In Transit" na
  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

const advanceOrderStatuses = async () => {
  const now = new Date();
  const orders = await Order.find({
    orderStatus: { $in: ['Picked Up', 'In Transit', 'Out for Delivery'] },
    isCancelled: false,
    isDelivered: false,
    etaIsAccurate: true,
  });

  for (const order of orders) {
    let changed = false;

    // ✅ Pag "In Transit" na — mao ni ang oras para i-deduct ang countInStock
    if (order.orderStatus === 'Picked Up' && order.inTransitAt && now >= order.inTransitAt) {
      order.orderStatus = 'In Transit';
      order.statusHistory.push({ status: 'In Transit', timestamp: order.inTransitAt, note: 'Ormoc Distribution Hub' });
      
      // ✅ I-deduct na ang actual countInStock + i-release ang reservedStock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            countInStock: -item.qty,
            reservedStock: -item.qty,
          },
        });
      }
      changed = true;
    }

    if ((order.orderStatus === 'In Transit' || changed) && order.outForDeliveryAt && now >= order.outForDeliveryAt) {
      order.orderStatus = 'Out for Delivery';
      order.statusHistory.push({ status: 'Out for Delivery', timestamp: order.outForDeliveryAt, note: `${order.shippingAddress.city} Delivery Hub` });
      changed = true;
    }

    if ((order.orderStatus === 'Out for Delivery' || changed) && order.deliveredAt && now >= order.deliveredAt) {
      order.orderStatus = 'Delivered';
      order.isDelivered = true;
      order.deliveredAt = now;
      order.statusHistory.push({ status: 'Delivered', timestamp: now, note: `${order.shippingAddress.address}, ${order.shippingAddress.city}` });
      changed = true;
    }

    if (changed) await order.save();
  }
};

// ✅ Cancel — i-restore base sa kung unsay na-deduct na
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (order) {
    if (order.isCancelled) { res.status(400); throw new Error('Order is already cancelled'); }
    if (order.isDelivered) { res.status(400); throw new Error('Cannot cancel a delivered order'); }

    const alreadyInTransit = ['In Transit', 'Out for Delivery'].includes(order.orderStatus);
    const alreadyPickedUpNotTransit = order.orderStatus === 'Picked Up';

    for (const item of order.orderItems) {
      if (alreadyInTransit) {
        // countInStock na gi-deduct pag In Transit — i-restore
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.qty },
        });
      } else {
        // Wala pa ma-In Transit (Order Created, Preparing, Picked Up)
        // i-release lang ang reservedStock
        await Product.findByIdAndUpdate(item.product, {
          $inc: { reservedStock: -item.qty },
        });
      }
    }

    order.isCancelled = true;
    order.cancelledAt = Date.now();
    order.cancelReason = reason || 'Cancelled by user';
    order.orderStatus = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled by user',
    });

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else { res.status(404); throw new Error('Order not found'); }
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
  res.json(orders);
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    await Order.deleteOne({ _id: order._id });
    res.json({ message: 'Order removed' });
  } else { res.status(404); throw new Error('Order not found'); }
});

const archiveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (!order.isDelivered) { res.status(400); throw new Error('Only delivered orders can be archived'); }
  order.isArchived = !order.isArchived;
  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

const updateOrderETA = asyncHandler(async (req, res) => {
  const { etaDate, etaReason, isDelay } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (etaDate === null) {
    const { min, max } = getETADaysRange(order.shippingAddress.city);
    order.etaStart = addBusinessDays(new Date(), min);
    order.etaEnd = addBusinessDays(new Date(), max);
    order.etaOverride = null;
    order.etaReason = '';
    order.etaIsDelayed = false;
  } else {
    order.etaOverride = new Date(etaDate);
    order.etaReason = etaReason || '';
    order.etaIsDelayed = !!isDelay;
  }

  order.etaUpdatedAt = new Date();
  order.etaUpdatedBy = req.user.name || req.user.email;

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

export {
  addOrderItems, getMyOrders, getOrderById, updateOrderToPaid,
  updateOrderToDelivered, prepareOrder, pickupOrder, advanceOrderStatuses,
  cancelOrder, getOrders, deleteOrder, archiveOrder, updateOrderETA,
};