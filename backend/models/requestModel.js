import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    productName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'available'],
      default: 'pending',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    replies: [replySchema],
    hasNewReply: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', requestSchema);
export default Request;