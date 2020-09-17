/* eslint-disable */

import '@babel/polyfill';
import { signup, resendEmail } from './signup';
import { confirmEmail } from './confirmEmail';
import { login, logout } from './login';
import { forgotPassword, resetPassword } from './forgotPassword';
import { updateSettings } from './updateUser';
import { displayMap } from './mapbox';

// DOM Elements
const cardContainer = document.querySelector('.card-container');
const mapBox = document.getElementById('map');
const signupForm = document.querySelector('.form--signup');
const resetPasswordForm = document.querySelector('.form--reset-password');
const emailConfirmationBox = document.querySelector('.emailConfirmationBox');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

// Delegation
if (cardContainer) {
  cardContainer.addEventListener('mouseup', function (event) {
    if (
      event.target.matches(`.card__header, .card__header *`) &&
      event.which === 1
    ) {
      const card = event.target.closest('.card');

      const cardSlug = card.dataset.slug;
      window.location.href = `/tour/${cardSlug}`;
    }
  });
}

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

  document
    .querySelector('.link--forgot-password')
    .addEventListener('click', function (event) {
      event.preventDefault();

      const email = prompt('Please type in your email');

      forgotPassword(email);
    });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', function (event) {
    document.querySelector('.btn--reset-password').textContent =
      'Changing Password...';
    event.preventDefault();

    const newPassword = document.getElementById('password').value;

    const newPasswordConfirm = document.getElementById('passwordConfirm').value;

    let token = window.location.toString().split('/').slice(-1);

    resetPassword(
      {
        password: newPassword,
        passwordConfirm: newPasswordConfirm,
      },
      token
    );
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

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('username', document.getElementById('username').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data').then(function () {
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
