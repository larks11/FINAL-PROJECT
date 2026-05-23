import { PRODUCTS_URL } from '../constants';
import { apiSlice } from './apiSlice';

const INVENTORY_URL = '/api/inventory';

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── PRODUCTS ──────────────────────────────────────────────────────────
    getProducts: builder.query({
      query: ({ keyword, pageNumber }) => ({
        url: PRODUCTS_URL,
        params: { keyword, pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Products'],
    }),
    getAdminProducts: builder.query({
      query: ({ pageNumber } = {}) => ({
        url: `${PRODUCTS_URL}/admin/all`,
        params: { pageNumber },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Products'],
    }),
    getProductDetails: builder.query({
      query: (productId) => ({ url: `${PRODUCTS_URL}/${productId}` }),
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
      query: (productId) => ({ url: `${PRODUCTS_URL}/${productId}/check-order` }),
      keepUnusedDataFor: 5,
    }),
    createProduct: builder.mutation({
      query: () => ({ url: PRODUCTS_URL, method: 'POST' }),
      invalidatesTags: ['Products', 'Inventory'], // ✅ invalidate inventory pud
    }),
    updateProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'Products',
        'Inventory', // ✅ sync inventory
        { type: 'Product', id: arg.productId },
      ],
    }),
    uploadProductImage: builder.mutation({
      query: (data) => ({ url: `/api/upload`, method: 'POST', body: data }),
    }),
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products', 'Inventory'], // ✅
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
    toggleArchiveProduct: builder.mutation({
      query: (id) => ({
        url: `${PRODUCTS_URL}/${id}/archive`,
        method: 'PUT',
      }),
      invalidatesTags: ['Products'],
    }),

    // ── REQUESTS ──────────────────────────────────────────────────────────
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
    deleteRequest: builder.mutation({
      query: (id) => ({
        url: `${PRODUCTS_URL}/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Requests'],
    }),
    deleteAllRequests: builder.mutation({
      query: () => ({
        url: `${PRODUCTS_URL}/requests/all`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Requests'],
    }),

    // ── SETTINGS ──────────────────────────────────────────────────────────
    getSettings: builder.query({
      query: () => '/api/settings',
      keepUnusedDataFor: 5,
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (data) => ({
        url: '/api/settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),

    // ── INVENTORY ─────────────────────────────────────────────────────────
    getInventory: builder.query({
      query: ({ keyword, category } = {}) => ({
        url: INVENTORY_URL,
        params: { keyword, category },
      }),
      keepUnusedDataFor: 5,
      providesTags: ['Inventory'],
    }),
    getInventoryStats: builder.query({
      query: () => `${INVENTORY_URL}/stats`,
      keepUnusedDataFor: 5,
      providesTags: ['Inventory'],
    }),
    getInventoryCategories: builder.query({
      query: () => `${INVENTORY_URL}/categories`,
      keepUnusedDataFor: 5,
      providesTags: ['Inventory'],
    }),
    updateInventoryItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${INVENTORY_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Inventory'],
    }),
    deleteInventoryItem: builder.mutation({
      query: (id) => ({
        url: `${INVENTORY_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory'],
    }),
    syncInventoryStock: builder.mutation({
      query: (id) => ({
        url: `${INVENTORY_URL}/${id}/sync`,
        method: 'PUT',
      }),
      invalidatesTags: ['Inventory', 'Products'],
    }),
    // ✅ NEW — Restock
    restockItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${INVENTORY_URL}/${id}/restock`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Inventory', 'Products'],
    }),
    // ✅ NEW — Stock History
    getStockHistory: builder.query({
      query: (id) => `${INVENTORY_URL}/${id}/history`,
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetAdminProductsQuery,
  useGetProductDetailsQuery,
  useGetProductsByCategoryQuery,
  useCheckUserOrderQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useDeleteProductMutation,
  useCreateReviewMutation,
  useGetTopProductsQuery,
  useToggleArchiveProductMutation,
  useSubmitRequestMutation,
  useGetRequestsQuery,
  useGetMyRequestsQuery,
  useGetUnreadCountQuery,
  useMarkRequestReadMutation,
  useMarkReplySeenMutation,
  useReplyToRequestMutation,
  useUserReplyToRequestMutation,
  useDeleteRequestMutation,
  useDeleteAllRequestsMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  // Inventory
  useGetInventoryQuery,
  useGetInventoryStatsQuery,
  useGetInventoryCategoriesQuery,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useSyncInventoryStockMutation,
  useRestockItemMutation,      
  useGetStockHistoryQuery,     
} = productsApiSlice;