import Stripe from 'stripe';

type StripeType = InstanceType<typeof Stripe>;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export interface CreatePaymentIntentInput {
  tenantId: number;
  leaseId: number;
  paymentId: number;
  amount: number;
  currency?: string;
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
}

export interface CreateCheckoutSessionInput {
  tenantId: number;
  leaseId: number;
  paymentId: number;
  amount: number;
  currency?: string;
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe payment intent for rent payment
 */
export async function createPaymentIntent(input: CreatePaymentIntentInput) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100), // Convert to cents
      currency: input.currency || 'usd',
      payment_method_types: ['card'],
      receipt_email: input.tenantEmail,
      metadata: {
        tenantId: input.tenantId.toString(),
        leaseId: input.leaseId.toString(),
        paymentId: input.paymentId.toString(),
        propertyName: input.propertyName,
        unitNumber: input.unitNumber,
        tenantName: input.tenantName,
      },
      description: `Rent payment for ${input.propertyName} Unit ${input.unitNumber}`,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Create a Stripe checkout session for rent payment
 */
export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: input.currency || 'usd',
            product_data: {
              name: `Rent Payment - ${input.propertyName}`,
              description: `Unit ${input.unitNumber}`,
              metadata: {
                propertyName: input.propertyName,
                unitNumber: input.unitNumber,
              },
            },
            unit_amount: Math.round(input.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.tenantEmail,
      client_reference_id: input.tenantId.toString(),
      metadata: {
        tenantId: input.tenantId.toString(),
        leaseId: input.leaseId.toString(),
        paymentId: input.paymentId.toString(),
        propertyName: input.propertyName,
        unitNumber: input.unitNumber,
        tenantName: input.tenantName,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve payment intent by metadata
 */
export async function getPaymentIntentByMetadata(paymentId: number) {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 1,
    });

    const intent = paymentIntents.data.find(
      (pi: Stripe.PaymentIntent) => pi.metadata?.paymentId === paymentId.toString()
    );

    return intent || null;
  } catch (error) {
    console.error('Error retrieving payment intent by metadata:', error);
    throw error;
  }
}

/**
 * Create a refund
 */
export async function createRefund(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error;
  }
}

/**
 * Get payment method details
 */
export async function getPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    throw error;
  }
}

/**
 * Construct webhook event
 */
export function constructWebhookEvent(body: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

export default stripe;
