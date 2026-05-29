import { apiSlice } from './apiSlice';
import { USERS_URL } from '../constants';

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: 'POST',
        body: data,
      }),
    }),
    googleLogin: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/google`,
        method: 'POST',
        body: data,
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`,
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: 'POST',
      }),
    }),
    profile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: 'PUT',
        body: data,
      }),
    }),
    getUsers: builder.query({
      query: () => ({
        url: USERS_URL,
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 5,
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `${USERS_URL}/${userId}`,
        method: 'DELETE',
      }),
    }),
    getUserDetails: builder.query({
      query: (id) => ({
        url: `${USERS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/${data.userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    // Forgot password
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/forgot-password`,
        method: 'POST',
        body: data,
      }),
    }),
    // Admin: get reset requests
    getPasswordResetRequests: builder.query({
      query: () => ({
        url: `${USERS_URL}/admin/reset-requests`,
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 5,
    }),
    // Admin: get locked accounts
    getLockedAccounts: builder.query({
      query: () => ({
        url: `${USERS_URL}/admin/locked`,
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 5,
    }),
    // Admin: approve & reset password
    adminResetPassword: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/admin/${data.userId}/reset-password`,
        method: 'PUT',
        body: { newPassword: data.newPassword },
      }),
      invalidatesTags: ['User'],
    }),
    // Admin: reject reset request
    adminRejectPasswordReset: builder.mutation({
      query: (userId) => ({
        url: `${USERS_URL}/admin/${userId}/reject-reset`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),
    // Admin: unlock account
    unlockAccount: builder.mutation({
      query: (userId) => ({
        url: `${USERS_URL}/admin/${userId}/unlock`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),
    // Mark notifications as read
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/notifications/read`,
        method: 'PUT',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useProfileMutation,
  useGetUsersQuery,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useGetUserDetailsQuery,
  useForgotPasswordMutation,
  useGetPasswordResetRequestsQuery,
  useGetLockedAccountsQuery,
  useAdminResetPasswordMutation,
  useAdminRejectPasswordResetMutation,
  useUnlockAccountMutation,
  useMarkNotificationsReadMutation,
} = userApiSlice;
