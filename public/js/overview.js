/* eslint-disable */

document.addEventListener('mouseup', function (event) {
  if (
    event.target.matches(`.card__header, .card__header *`) &&
    event.which === 1
  ) {
    const card = event.target.closest('.card');

    const cardSlug = card.dataset.slug;
    window.location.href = `/tour/${cardSlug}`;
  }
});
