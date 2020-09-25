/* eslint-disable */

import axios from 'axios';

export const paymentIntent = function (tourId) {
  // A reference to Stripe.js initialized with with real test publishable API key
  var stripe = Stripe(
    'pk_test_51HSTXfKuxt2HJ9IyDhX3vaYE25zgguDdppRG1FCUwdnz8QlebPYcbskHEU5WlbSrFNkaTbmLkq5MNasLHJmWhYtP00OWxKF7oa'
  );

  var paymentForm = document.querySelector('.payment-form');
  var paymentButton = document.querySelector('.btn--payment-form');

  // disable the button until stripe is set up on the page
  paymentButton.disabled = true;

  axios({
    method: 'POST',
    url: 'http://127.0.0.1:3000/api/v1/bookings/',
    data: {
      tourId: tourId,
    },
  }).then(function (result) {
    var elements = stripe.elements();

    var style = {
      base: {
        color: '#32325d',
        fontFamily: 'Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#32325d',
        },
      },
      invalid: {
        fontFamily: 'Arial, sans-serif',
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    };

    var card = elements.create('card', { style: style });

    card.mount('#card-element');

    card.on('change', function (event) {
      // Disable the Pay button if there are no card details in the Element
      paymentButton.disabled = event.empty;
      document.querySelector('.card-error').textContent = event.error
        ? event.error.message
        : '';
    });

    paymentForm.addEventListener('submit', function (event) {
      event.preventDefault();
      // complete payment when form is submitted
      payWithCard(stripe, card, result.data.data.clientSecret);
    });
  });

  var payWithCard = function (stripe, card, clientSecret) {
    loading(true);
    if (!clientSecret) return showError('Invalid card number.');
    stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
        },
      })
      .then(function (result) {
        if (result.error) {
          // Show error to your customer
          showError(result.error.message);
        } else {
          // The payment succeeded!
          orderComplete(result.paymentIntent.id);
        }
      });
  };

  // shows a sucess message when the payment is complete
  var orderComplete = function (paymentIntentId) {
    loading(false);
    document
      .querySelector('.result-message a')
      .setAttribute(
        'href',
        'https://dashboard.stripe.com/test/payments' + paymentIntentId
      );
    document.querySelector('.result-message').classList.remove('hidden');
    document.querySelector('.btn--payment-form').disabled = true;
  };

  // show the customer the error from Stripe if card fails to charge
  var showError = function (message) {
    loading(false);
    var errorMsg = document.querySelector('.card-error');
    errorMsg.textContent = message;

    setTimeout(function () {
      errorMsg.textContent = '';
    }, 4000);
  };

  // show a spinner on payment submission
  var loading = function (isLoading) {
    if (isLoading) {
      // Disable the button and show a spinner
      document.querySelector('.btn--payment-form').disabled = true;
      document.querySelector('#spinner').classList.remove('hidden');
      document.querySelector('#button-text').classList.add('hidden');
    } else {
      // Enable the button and hide the spinner
      document.querySelector('.btn--payment-form').disabled = false;
      document.querySelector('#spinner').classList.add('hidden');
      document.querySelector('#button-text').classList.remove('hidden');
    }
  };
};
