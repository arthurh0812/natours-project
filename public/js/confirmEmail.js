import axios from 'axios';
import { showAlert } from './alerts';

export const confirmEmail = async function (token) {
  try {
    const res = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/users/confirmEmail/${token}`,
    });

    if (res.data.status === 'success') {
      window.location.assign('/');
    }
  } catch (error) {
    showAlert('error', 'Invalid token');
  }
};
