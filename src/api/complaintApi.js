import { baseApi } from './baseApi';
import { API_SECOND_BASE_URL } from '@env';

export const complaintApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    postComplaint: builder.mutation({
      query: body => {
        const formData = new FormData();
        formData.append('customer_id', body.customer_id);
        formData.append('user_name', body.user_name);
        formData.append('userEmail', body.userEmail);
        formData.append('address', body.address);
        formData.append('packageType', body.packageType);
        formData.append('serviceType', body.serviceType);
        formData.append('priority', body.priority);
        formData.append('lineman_name', body.lineman_name);
        formData.append('issue_desc', body.issue_desc);

        if (body.ticket_id) {
          formData.append('ticket_id', body.ticket_id);
        }

        const baseUrl = API_SECOND_BASE_URL.endsWith('/')
          ? API_SECOND_BASE_URL.slice(0, -1)
          : API_SECOND_BASE_URL;

        return {
          url: `${baseUrl}/ticket/complaint_post.php`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Complaints'],
    }),
    getComplaints: builder.query({
      query: () => {
        const baseUrl = API_SECOND_BASE_URL.endsWith('/')
          ? API_SECOND_BASE_URL.slice(0, -1)
          : API_SECOND_BASE_URL;

        return {
          url: `${baseUrl}/ticket/get_data.php`,
          method: 'GET',
        };
      },
      providesTags: ['Complaints'],
    }),
  }),
  overrideExisting: true,
});

export const { usePostComplaintMutation, useGetComplaintsQuery } = complaintApi;
export default complaintApi;
