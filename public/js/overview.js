document.addEventListener('mouseup', function (event) {
  if (
    event.target.matches(`.card__header, .card__header *`) &&
    event.which === 1
  ) {
    const card = event.target.closest('.card');

    const link = card.querySelector('.card__footer').querySelector('a').href;
    window.location.href = link;
  }
});
