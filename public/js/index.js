/* eslint-disable */

import '@babel/polyfill';
import { signup, resendEmail } from './signup';
import { confirmEmail } from './confirmEmail';
import { login, logout } from './login';
import { updateSettings } from './updateUser';
import { displayMap } from './mapbox';

// DOM Elements
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form--signup');
const emailConfirmationBox = document.querySelector('.emailConfirmationBox');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// Delegation
if (mapBox) {
  let locations = JSON.parse(mapBox.dataset.locations);
  locations.unshift(JSON.parse(mapBox.dataset.startlocation));

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const emailOrUsername = document.getElementById('email').value;

    const password = document.getElementById('password').value;

    login(emailOrUsername, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    document.querySelector('.btn--signup').textContent = 'Signing up...';

    const name = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await signup({
      name: name,
      username: username,
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
    }).catch(function (error) {
      console.log('error', error);
    });

    const emailResendButton = document.querySelector('.email-resend');

    emailResendButton.addEventListener('click', function (event) {
      if (event.which === 1) {
        resendEmail();
      }
    });
  });
}

if (emailConfirmationBox) {
  confirmEmail(emailConfirmationBox.dataset.token);
}

if (logoutBtn) {
  logoutBtn.addEventListener('mouseup', function (event) {
    if (event.which === 1) {
      logout();
    }
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', function (event) {
    event.preventDefault();

    document.querySelector('.btn--save-settings').textContent = 'Updating...';

    const name = document.getElementById('name').value;

    const username = document.getElementById('username').value;

    const email = document.getElementById('email').value;

    updateSettings(
      {
        name: name,
        username: username,
        email: email,
      },
      'data'
    ).then(function () {
      document.querySelector('.btn--save-settings').textContent =
        'Save Settings';
    });
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', function (event) {
    event.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const currentPassword = document.getElementById('password-current').value;

    const newPassword = document.getElementById('password').value;

    const confirmPassword = document.getElementById('password-confirm').value;

    updateSettings(
      {
        currentPassword: currentPassword,
        newPassword: newPassword,
        newPasswordConfirm: confirmPassword,
      },
      'password'
    ).then(function () {
      document.querySelector('.btn--save-password').textContent =
        'Save Password';

      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
    });
  });
}
