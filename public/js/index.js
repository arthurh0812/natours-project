/* eslint-disable */

import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateUser';
import { displayMap } from './mapbox';

// DOM Elements
const mapBox = document.getElementById('map');
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
