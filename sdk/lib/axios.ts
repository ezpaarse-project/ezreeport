import axios, { Axios } from 'axios';

export interface ApiResponse<T> {
  status: {
    code: number,
    message: string,
  },
  content: T
}

const agent = axios.create({
  baseURL: 'http://localhost:8080',
});

export default Object.assign(
  agent,
  {
    $get: async <T>(...params: Parameters<Axios['get']>) => (await agent.get<ApiResponse<T>>(...params)).data,
    $post: async <T>(...params: Parameters<Axios['post']>) => (await agent.post<ApiResponse<T>>(...params)).data,
    $put: async <T>(...params: Parameters<Axios['put']>) => (await agent.put<ApiResponse<T>>(...params)).data,
    $patch: async <T>(...params: Parameters<Axios['patch']>) => (await agent.patch<ApiResponse<T>>(...params)).data,
    $delete: async <T>(...params: Parameters<Axios['delete']>) => (await agent.delete<ApiResponse<T>>(...params)).data,
  },
);
