import { PRODUCTS_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: PRODUCTS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Products'],
    }),
    getProductDetails: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
      }),
      keepUnusedDataFor: 5,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getProductsByCategory: builder.query({
      query: (category) => ({
        url: `${PRODUCTS_URL}/category/${encodeURIComponent(category)}`,
      }),
      keepUnusedDataFor: 5,
    }),
    checkUserOrder: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}/check-order`,
      }),
      keepUnusedDataFor: 5,
    }),
    createProduct: builder.mutation({
      query: () => ({
        url: `${PRODUCTS_URL}`,
        method: 'POST',
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'Products',
        { type: 'Product', id: arg.productId },
      ],
    }),
    uploadProductImage: builder.mutation({
      query: (data) => ({
        url: `/api/upload`,
        method: 'POST',
        body: data,
      }),
    }),
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'Products',
        { type: 'Product', id: arg.productId },
      ],
    }),
    getTopProducts: builder.query({
      query: () => `${PRODUCTS_URL}/top`,
      keepUnusedDataFor: 5,
      providesTags: ['Products'],
    }),
    submitRequest: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/request`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MyRequests'],
    }),
    getRequests: builder.query({
      query: () => `${PRODUCTS_URL}/requests`,
      keepUnusedDataFor: 5,
      providesTags: ['Requests'],
    }),
    getMyRequests: builder.query({
      query: () => `${PRODUCTS_URL}/my-requests`,
      keepUnusedDataFor: 5,
      providesTags: ['MyRequests'],
    }),
    getUnreadCount: builder.query({
      query: () => `${PRODUCTS_URL}/requests/unread-count`,
      keepUnusedDataFor: 1,
      providesTags: ['Requests'],
    }),
    markRequestRead: builder.mutation({
      query: (id) => ({
        url: `${PRODUCTS_URL}/requests/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Requests'],
    }),
    markReplySeen: builder.mutation({
      query: (id) => ({
        url: `${PRODUCTS_URL}/requests/${id}/seen`,
        method: 'PUT',
      }),
      invalidatesTags: ['MyRequests'],
    }),
    replyToRequest: builder.mutation({
      query: ({ id, message }) => ({
        url: `${PRODUCTS_URL}/requests/${id}/reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Requests'],
    }),
    userReplyToRequest: builder.mutation({
      query: ({ id, message }) => ({
        url: `${PRODUCTS_URL}/requests/${id}/user-reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['MyRequests'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductDetailsQuery,
  useGetProductsByCategoryQuery,
  useCheckUserOrderQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useDeleteProductMutation,
  useCreateReviewMutation,
  useGetTopProductsQuery,
  useSubmitRequestMutation,
  useGetRequestsQuery,
  useGetMyRequestsQuery,
  useGetUnreadCountQuery,
  useMarkRequestReadMutation,
  useMarkReplySeenMutation,
  useReplyToRequestMutation,
  useUserReplyToRequestMutation,
} = productsApiSlice;