import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice:    { type: Number, required: true, default: 0.0 },
    taxPrice:      { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice:    { type: Number, required: true, default: 0.0 },
    isPaid:        { type: Boolean, required: true, default: false },
    paidAt:        { type: Date },
    isDelivered:   { type: Boolean, required: true, default: false },
    deliveredAt:   { type: Date },
    isCancelled:   { type: Boolean, default: false },
    cancelledAt:   { type: Date },
    cancelReason:  { type: String, default: '' },

    // ✅ DELIVERY STATUS (gi-merge ang duha ka version)
    deliveryStatus: {
      type: String,
      enum: [
        'order_created',
        'prepared',
        'picked_up',
        'in_transit',
        'arrived',
        'out_for_delivery',
        'delivered',
      ],
      default: 'order_created',
    },
    deliveryStatusHistory: [
      {
        status:    { type: String },
        timestamp: { type: Date, default: Date.now },
        note:      { type: String, default: '' },
      },
    ],
    estimatedDeliveryDate: { type: Date },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;