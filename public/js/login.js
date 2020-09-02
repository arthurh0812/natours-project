/* eslint-disable */

document
  .querySelector('.btn--green')
  .addEventListener('click', function (event) {
    const email = document.getElementById('email').innerHTML;

    const password = document.getElementById('password').innerHTML;

    console.log(email, password);
  });
