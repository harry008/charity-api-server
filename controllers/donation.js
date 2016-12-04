import path from 'path';
import dotenv from 'dotenv';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: path.resolve(path.join(process.cwd(), '.env')) });

const stripe = require('stripe')(process.env.STRIPE_SKEY);

/**
 * POST /api/stripe
 * Make a payment.
 */
export default function postStripe(req, res) {
  req.assert('stripeToken', 'Token not provied').notEmpty();
  req.assert('amount', 'Enter valid amount').notEmpty();
  req.assert('cardHolderName', 'Card holder\'s name should not be empty').notEmpty();
  const errors = req.validationErrors();

  if (errors) {
    const errorMessages = errors.map(e => e.msg);
    return res.json({
      error: true,
      errors: errorMessages
    });
  }

  const name = req.body.cardHolderName;
  const stripeToken = req.body.stripeToken;
  // const stripeEmail = req.body.stripeEmail;
  let userEmail = null;
  if (req.user && req.user.email) {
    userEmail = req.user.email;
  }
  const amount = req.body.amount;

  stripe.charges.create({
    amount: amount * 100,
    currency: 'inr', // Indian currency (result in USD converted)
    source: stripeToken,
    description: `Donation from ${name}(${userEmail || ''})`
  }, (err) => {
    if (!err) {
      return res.json({
        error: false,
        message: `You have successfully donated ${amount}. Thank you.`
      });
    }

    if (err && err.type === 'StripeCardError') {
      // req.flash('errors', { msg: 'Your card has been declined.' });
      // return res.redirect('/api/stripe');
      return res.json({
        error: true,
        message: 'Your card has been declined.'
      });
    }
    console.error(err);
    return res.status(500).json({
      error: true,
      message: 'Internal server error'
    });
  });
}
