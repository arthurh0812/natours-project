/* eslint-disable */

export const hideAlert = function () {
  const alert = document.querySelector('.alert');
  if (alert) {
    alert.classList.remove('show');
    window.setTimeout(alert.parentElement.removeChild(alert));
  }
};

export const showAlert = function (type, message) {
  hideAlert();

  const markup = `<div class="alert alert--${type}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  document.querySelector('.alert').classList.add('show');
  window.setTimeout(hideAlert, 4000);
};
