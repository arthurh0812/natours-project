/* eslint-disable */

import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';

// DOM Elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form');
const logoutBtn = document.querySelector('.nav__el--logout');

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
