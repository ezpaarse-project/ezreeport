import axios, { Axios, AxiosError, AxiosResponse } from 'axios';

export interface ApiResponse<T> {
  /**
   * HTTP Status
   */
  status: {
    code: number,
    message: string,
  },
  /**
   * Content of the response
   */
  content: T
}

export interface PaginatedApiResponse<T, K extends keyof T> extends ApiResponse<T[]> {
  meta: {
    /**
     * Count of items in response
     */
    count: number,
    /**
     * Count of items wanted
     */
    size: number,
    /**
     * Count of items available
     */
    total: number,
    /**
     * Id of last item in response
     */
    lastId?: T[K]
  }
}

const agent = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Start axios request with basic error handling
 *
 * @param method The request's method
 * @param params The other params of axios
 *
 * @returns Response
 */
export const axiosWithErrorFormatter = async <T, Method extends 'get' | 'post' | 'put' | 'patch' | 'delete'>(
  method: Method,
  ...params: Parameters<Axios[Method]>
): Promise<AxiosResponse<T>> => {
  try {
    // @ts-expect-error
    return await agent[method](...params);
  } catch (error) {
    if (!(error instanceof AxiosError) || !error.response) {
      throw error;
    }
    const res: Required<AxiosError<ApiResponse<{ message: string }>>>['response'] = error.response;

    let message = '';
    switch (res.status) {
      case 400:
        message = 'Check parameters or API token';
        break;
      case 401:
        message = 'You must be logged before using this function, use `auth.login(token)`';
        break;
      case 403:
        message = 'You dont have enough permissions';
        break;
      case 404:
        message = 'Check parameters';
        break;
      case 409:
        message = 'Request conflit with current state';
        break;
      case 500:
        message = 'Something went wrong with server';
        break;

      default:
        break;
    }
    message = `${error.code} (${res.status}) - ${message}: ${res.data.content.message}`;
    throw new Error(message);
  }
};

export default Object.assign(
  agent,
  {
    $get: async <T>(...params: Parameters<Axios['get']>) => (await axiosWithErrorFormatter<ApiResponse<T>, 'get'>('get', ...params)).data,
    $post: async <T>(...params: Parameters<Axios['post']>) => (await axiosWithErrorFormatter<ApiResponse<T>, 'post'>('post', ...params)).data,
    $put: async <T>(...params: Parameters<Axios['put']>) => (await axiosWithErrorFormatter<ApiResponse<T>, 'put'>('put', ...params)).data,
    $patch: async <T>(...params: Parameters<Axios['patch']>) => (await axiosWithErrorFormatter<ApiResponse<T>, 'patch'>('patch', ...params)).data,
    $delete: async <T>(...params: Parameters<Axios['delete']>) => (await axiosWithErrorFormatter<ApiResponse<T>, 'delete'>('delete', ...params)).data,
  },
);
