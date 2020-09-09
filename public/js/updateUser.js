import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async function (data, type) {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${
        type === 'password' ? 'changeMyPassword' : 'updateMe'
      }`,
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `Saved ${type} succesfully!`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
    window.location.reload();
  }
};
