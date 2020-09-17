import axios from 'axios';
import { infoPage } from './pages';
import { showAlert } from './alerts';

export const forgotPassword = async function (email) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/forgotPassword',
      data: {
        email: email,
      },
    });

    if (res.data.status === 'success') {
      infoPage(
        'Password Reset',
        'We sent you an email to reset your password. Please check your email inbox!'
      );
    }
  } catch (error) {
    if (error.response.data.message)
      showAlert('error', error.response.data.message);
  }
};

export const resetPassword = async function (data, token) {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/resetPassword/${token}`,
      data: data,
    }).then(function () {
      document.querySelector('.btn--reset-password').textContent =
        'Change my Password';
      showAlert('success', 'Successfully changed password');
      window.location.assign('/');
    });
  } catch (error) {
    showAlert('error', error.message);
  }
};
