const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { catchHandler } = require('../utils/catchFunction');
const Tour = require('../models/tourModel');

let paymentIntent;
let paymentMethod;

const chargeCustomer = async (customerId, price) => {
  // lookup the payment methods available for the customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  const paymentIntentOptions = {
    amount: price,
    currency: 'usd',
    customer: customerId,
    off_session: true,
    confirm: true,
  };

  if (paymentMethods.data[0])
    paymentIntentOptions.payment_method = paymentMethods.data[0].id;
  // charge the customer and payment method immediately
  paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);
};

exports.getPaymentIntent = catchHandler(async (request, response, next) => {
  // 1) get the booked tour
  const tour = await Tour.findById(request.body.tourId);

  // 2) get the customer by user's stripe Id
  let customer;

  if (request.user.stripeId) {
    customer = await stripe.customers.retrieve(request.user.stripeId);
  } else {
    customer = null;
  }

  // 3) if there is a customer with that Id:
  if (customer) {
    await chargeCustomer(customer.id, tour.price * 100);
  }
  // 4) there is no customer with that Id: create new one
  else {
    // Alternatively, set up a webhook to listen for the payment_intent.succeeded event
    // and attach the PaymentMethod to a new Customer

    // 2) create a payment intent with the order amount and currency
    paymentIntent = await stripe.paymentIntents.create({
      setup_future_usage: 'off_session',
      amount: tour.price * 100,
      currency: 'usd',
      payment_method_types: ['card'],
    });
  }

  // 5) send client secret in response
  response.status(200).json({
    status: 'success',
    data: {
      clientSecret: paymentIntent.client_secret,
    },
  });
});

exports.webhook = async (request, response) => {
  const event = request.body;

  let customer;
  // handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      paymentIntent = event.data.object;

      if (!request.user.stripeId) {
        // 3) save Stripe's customer ID to user
        customer = await stripe.customers.create({
          email: request.user.email,
        });
        request.user.stripeId = customer.id;
        await request.user.save({ validateModifiedOnly: true });
      }
      break;
    case 'payment_method.attached':
      paymentMethod = event.data.object;
      // here comes the code to be executed at a succesful attachment of a PaymentMethod
      break;
    default:
      // unexpected event type
      return response.status(400).end();
  }

  response.status(200).json({
    received: true,
  });
};
