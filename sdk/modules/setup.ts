import axios from '../lib/axios';

export { isLogged, login, logout } from './auth';

/**
 * Set API url to axios
 *
 * @param url The url
 */
export const setURL = (url: string) => {
  axios.defaults.baseURL = url;
};

/**
 * Unset API url from axios
 */
export const unsetURL = () => {
  axios.defaults.baseURL = undefined;
};

/**
 * Check if API url is setup in axios.
 *
 * @returns If API url is setup
 */
export const isURLset = () => !axios.defaults.baseURL;
