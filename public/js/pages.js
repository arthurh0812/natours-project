export const infoPage = function (title, message) {
  // clear content
  const main = document.querySelector('.main');
  main.removeChild(main.childNodes[0]);

  const markup = `<div class="info">
                    <div class="info__title">
                      <h2 class="heading-secondary">${title}</h2>
                    </div>
                    <div class="info__message">${message}</div>
                  </div>`;

  main.insertAdjacentHTML('afterbegin', markup);
};

export const insertButton = function (element, className, text) {
  const markup = `<button class="${className}">${text}</div>`;

  document.querySelector(`.${element}`).insertAdjacentHTML('beforeend', markup);
};

export const errorPage = function (message) {
  // clear content
  const main = document.querySelector('.main');
  main.removeChild(main.childNodes[0]);

  const markup = `<div class="error">
                    <div class="error__title">
                      <h2 class="heading-secondary.heading-secondary--error">Huh?! Something went wrong!</h2>
                    <div class="error__msg">${message}</div>
                  </div>`;

  main.insertAdjacentHTML('afterbegin', markup);
};
