import { apiSlice } from './apiSlice';
import { ORDERS_URL, PAYPAL_URL } from '../constants';

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (order) => ({
        url: ORDERS_URL,
        method: 'POST',
        body: order,
      }),
    }),
    getOrderDetails: builder.query({
      query: (id) => ({
        url: `${ORDERS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    payOrder: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `${ORDERS_URL}/${orderId}/pay`,
        method: 'PUT',
        body: details,
      }),
    }),
    getPaypalClientId: builder.query({
      query: () => ({
        url: PAYPAL_URL,
      }),
      keepUnusedDataFor: 5,
    }),
    getMyOrders: builder.query({
      query: () => ({
        url: `${ORDERS_URL}/mine`,
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Orders'],
    }),
    getOrders: builder.query({
      query: () => ({
        url: ORDERS_URL,
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Orders'],
    }),
    deliverOrder: builder.mutation({
      query: (orderId) => ({
        url: `${ORDERS_URL}/${orderId}/deliver`,
        method: 'PUT',
      }),
      invalidatesTags: ['Orders'],
    }),
    cancelOrder: builder.mutation({
      query: ({ orderId, reason }) => ({
        url: `${ORDERS_URL}/${orderId}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: ['Orders'],
    }),
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `${ORDERS_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Orders'],
    }),
    prepareOrder: builder.mutation({
      query: (orderId) => ({
        url: `${ORDERS_URL}/${orderId}/prepare`,
        method: 'PUT',
      }),
      invalidatesTags: ['Orders'],
    }),
    pickupOrder: builder.mutation({
      query: (orderId) => ({
        url: `${ORDERS_URL}/${orderId}/pickup`,
        method: 'PUT',
      }),
      invalidatesTags: ['Orders'],
    }),
    // ✅ NEW: Archive Order
    archiveOrder: builder.mutation({
      query: (orderId) => ({
        url: `${ORDERS_URL}/${orderId}/archive`,
        method: 'PUT',
      }),
      invalidatesTags: ['Orders'],
    }),
    // ── REPORTS ──
    getSalesReport: builder.query({
      query: (period = 'monthly') => ({
        url: `/api/reports/sales?period=${period}`,
      }),
      keepUnusedDataFor: 5,
    }),
    getTopProducts: builder.query({
      query: () => ({
        url: `/api/reports/top-products`,
      }),
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderDetailsQuery,
  usePayOrderMutation,
  useGetPaypalClientIdQuery,
  useGetMyOrdersQuery,
  useGetOrdersQuery,
  useDeliverOrderMutation,
  useCancelOrderMutation,
  useDeleteOrderMutation,
  usePrepareOrderMutation,
  usePickupOrderMutation,
  useArchiveOrderMutation,
  useGetSalesReportQuery,
  useGetTopProductsQuery,
} = orderApiSlice;