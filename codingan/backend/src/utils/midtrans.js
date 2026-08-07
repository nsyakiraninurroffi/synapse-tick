const midtransClient = require('midtrans-client');

// ── Midtrans Snap Client ──
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-PLACEHOLDER',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-PLACEHOLDER',
});

// ── Midtrans Core API Client (for status check & refund) ──
const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-PLACEHOLDER',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-PLACEHOLDER',
});

/**
 * Create Midtrans Snap Transaction Token
 * @param {Object} params
 * @param {string} params.orderId - Unique order/transaction reference ID
 * @param {number} params.grossAmount - Total amount in IDR
 * @param {Object} params.customer - { name, email, phone }
 * @param {Array} params.items - [{ id, name, price, quantity }]
 * @param {string} params.eventName - For custom display
 * @returns {Promise<{token: string, redirect_url: string}>}
 */
async function createSnapTransaction({ orderId, grossAmount, customer, items, eventName }) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(grossAmount), // Midtrans requires integer
    },
    item_details: items.map((item) => ({
      id: item.id,
      name: item.name.substring(0, 50), // Midtrans max 50 chars
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    customer_details: {
      first_name: customer.name || 'Customer',
      email: customer.email || '',
      phone: customer.phone || '',
    },
    callbacks: {
      finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets`,
      error: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets`,
      pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-tickets`,
    },
    expiry: {
      unit: 'minutes',
      duration: 15, // Payment expires in 15 minutes
    },
    custom_field1: eventName || '',
  };

  try {
    const snapResponse = await snap.createTransaction(parameter);
    return {
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url,
    };
  } catch (error) {
    console.error('[Midtrans] Failed to create Snap transaction:', error.message);
    throw new Error(`Midtrans Snap error: ${error.message}`);
  }
}

/**
 * Verify Midtrans notification signature
 * @param {Object} notificationBody - Raw notification body from Midtrans webhook
 * @returns {Promise<Object>} - Verified transaction status
 */
async function verifyNotification(notificationBody) {
  try {
    const statusResponse = await coreApi.transaction.notification(notificationBody);
    return {
      orderId: statusResponse.order_id,
      transactionStatus: statusResponse.transaction_status,
      fraudStatus: statusResponse.fraud_status,
      paymentType: statusResponse.payment_type,
      grossAmount: statusResponse.gross_amount,
      transactionId: statusResponse.transaction_id,
      settlementTime: statusResponse.settlement_time,
    };
  } catch (error) {
    console.error('[Midtrans] Notification verification failed:', error.message);
    throw new Error(`Midtrans verification error: ${error.message}`);
  }
}

/**
 * Check transaction status directly from Midtrans
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
async function checkTransactionStatus(orderId) {
  try {
    const response = await coreApi.transaction.status(orderId);
    return response;
  } catch (error) {
    console.error('[Midtrans] Status check failed:', error.message);
    throw error;
  }
}

module.exports = { snap, coreApi, createSnapTransaction, verifyNotification, checkTransactionStatus };
