/* eslint-disable */

const login = async function (emailOrUsername, password) {
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
      alert('Signed In succesfully!');
      window.setTimeout(function () {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    alert(error.response.message);
  }
};

document.querySelector('.form').addEventListener('submit', function (event) {
  event.preventDefault();

  const emailOrUsername = document.getElementById('email').value;

  const password = document.getElementById('password').value;

  login(emailOrUsername, password);
});
