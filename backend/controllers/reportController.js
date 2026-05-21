import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';

// GET /api/reports/sales?period=daily|weekly|monthly
const getSalesReport = asyncHandler(async (req, res) => {
  const { period = 'monthly' } = req.query;

  const now = new Date();
  let startDate;

  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29); // last 30 days
  } else if (period === 'weekly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 83); // last 12 weeks
  } else {
    startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1); // last 12 months
  }

  const orders = await Order.find({
    createdAt: { $gte: startDate },
    isCancelled: false,
  });

  // Group by period
  const groupedData = {};

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    let key;

    if (period === 'daily') {
      key = date.toISOString().substring(0, 10); // YYYY-MM-DD
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().substring(0, 10);
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!groupedData[key]) {
      groupedData[key] = { period: key, sales: 0, orders: 0, shipping: 0, tax: 0, items: 0 };
    }

    groupedData[key].sales    += order.totalPrice;
    groupedData[key].orders   += 1;
    groupedData[key].shipping += order.shippingPrice;
    groupedData[key].tax      += order.taxPrice;
    groupedData[key].items    += order.itemsPrice;
  });

  const result = Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));

  // Summary totals
  const allOrders = await Order.find({ isCancelled: false });
  const cancelledOrders = await Order.find({ isCancelled: true });

  const summary = {
    totalRevenue:    allOrders.reduce((s, o) => s + o.totalPrice, 0),
    totalOrders:     allOrders.length,
    totalCancelled:  cancelledOrders.length,
    totalShipping:   allOrders.reduce((s, o) => s + o.shippingPrice, 0),
    totalTax:        allOrders.reduce((s, o) => s + o.taxPrice, 0),
    totalItemsSales: allOrders.reduce((s, o) => s + o.itemsPrice, 0),
    avgOrderValue:   allOrders.length > 0
      ? allOrders.reduce((s, o) => s + o.totalPrice, 0) / allOrders.length
      : 0,
  };

  res.json({ summary, chartData: result });
});

// GET /api/reports/top-products
const getTopProducts = asyncHandler(async (req, res) => {
  const orders = await Order.find({ isCancelled: false });

  const productMap = {};

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const id = item.product?.toString() || item.name;
      if (!productMap[id]) {
        productMap[id] = { name: item.name, qtySold: 0, revenue: 0 };
      }
      productMap[id].qtySold  += item.qty;
      productMap[id].revenue  += item.qty * item.price;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  res.json(topProducts);
});

export { getSalesReport, getTopProducts };