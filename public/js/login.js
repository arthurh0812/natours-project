/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async function (emailOrUsername, password) {
  const data = {
    password: password,
  };

  if (emailOrUsername.includes('@')) data.email = emailOrUsername;
  else data.username = emailOrUsername;

  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Signed In succesfully!');
      window.setTimeout(function () {
        location.assign('/');
      }, 500);
    }
  } catch (error) {
    if (
      error.response.data.message.startsWith(
        'You had too many incorrect signin attempts.'
      )
    )
      window.location.reload();
    else if (error.response.data.message)
      showAlert('error', error.response.data.message);
  }
};

export const logout = async function () {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    if (res.data.status === 'success') window.location.reload(true);
  } catch (error) {
    console.log(error);
    showAlert(
      'error',
      'Error signing out. Please check your internet connection!'
    );
  }
};
