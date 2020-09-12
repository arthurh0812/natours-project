import axios from 'axios';
import { infoPage, insertButton } from './pages';
import { showAlert } from './alerts';

export const signup = async function (data) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Successfully signed up!');
      document.querySelector('.btn--signup').textContent = 'Sign up';
      infoPage(
        'Email Confirmation',
        'We sent an email to check if you really have access to the email you typed in. Please check your email inbox!'
      );
      insertButton('info', 'email-resend', 'Send email again');
    }
  } catch (error) {
    if (error.response.data.message)
      showAlert('error', error.response.data.message);
    throw error;
  }
};

export const resendEmail = async function () {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/resendEmail',
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Email successfully sent!');
    }
  } catch (error) {
    if (error.response.data.message)
      showAlert('error', error.response.data.message);
  }
};
