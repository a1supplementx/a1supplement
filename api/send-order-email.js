export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, order, status } = req.body;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured in environment variables' });
  }

  if (!order || !order.customerData || !order.customerData.email) {
    return res.status(400).json({ error: 'Missing required order details or customer email' });
  }

  try {
    let emailSubject = '';
    let emailHtml = '';

    const customerName = `${order.customerData.firstName} ${order.customerData.lastName}`;
    const itemsListHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 12px 0; vertical-align: middle;">
          <div style="font-weight: bold; color: #ffffff; font-size: 14px;">${item.name}</div>
          <div style="font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">${item.category || ''}</div>
        </td>
        <td style="padding: 12px 0; text-align: center; color: #aaaaaa; font-size: 14px;">x${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #FFD700; font-size: 14px;">₹${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const fulfillmentDetails = order.fulfillmentType === 'pickup'
      ? `<p style="margin: 0; color: #dddddd;">🏪 <strong>Store Pickup:</strong> ${order.customerData.pickupLocation || 'Main Store'}</p>`
      : `<p style="margin: 0; color: #dddddd;">🚚 <strong>Delivery Address:</strong><br>${order.customerData.address}, ${order.customerData.city} - ${order.customerData.zipCode || ''}</p>`;

    const paymentDetails = order.paymentMethod === 'cod'
      ? '💵 Cash on Delivery'
      : order.paymentMethod === 'bank'
      ? '🏦 Bank Transfer'
      : '💳 Online Payment';

    // 1. NEW ORDER RECEIVED EMAIL
    if (type === 'new_order') {
      emailSubject = `Order Confirmed #${order.id} | A1 Supplements`;
      
      let bankDetailsHtml = '';
      if (order.paymentMethod === 'bank') {
        bankDetailsHtml = `
          <div style="background-color: #161616; border: 1px solid rgba(255, 215, 0, 0.3); padding: 20px; margin-top: 25px; border-radius: 4px;">
            <h4 style="color: #FFD700; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; border-b: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">🏦 Beneficiary Bank Account Details</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cccccc;">
              <tr><td style="padding: 4px 0; color: #888888;">Bank Name:</td><td style="text-align: right; color: #ffffff; font-weight: bold;">State Bank of India</td></tr>
              <tr><td style="padding: 4px 0; color: #888888;">Account Name:</td><td style="text-align: right; color: #ffffff; font-weight: bold;">A1 Supplements Private Limited</td></tr>
              <tr><td style="padding: 4px 0; color: #888888;">Account Number:</td><td style="text-align: right; color: #ffffff; font-family: monospace; font-size: 14px; font-weight: bold;">390218904729</td></tr>
              <tr><td style="padding: 4px 0; color: #888888;">IFSC Code:</td><td style="text-align: right; color: #ffffff; font-family: monospace; font-size: 14px; font-weight: bold;">SBIN0004019</td></tr>
            </table>
            <div style="margin-top: 15px; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 11px; color: #aaaaaa; line-height: 1.5;">
              <strong style="color: #FFD700;">Instructions:</strong> Please transfer the total amount to the account above and mention Order #${order.id} in your transaction notes. We will verify and process your order immediately.
            </div>
          </div>
        `;
      }

      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${emailSubject}</title>
        </head>
        <body style="background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px 0; color: #ffffff; -webkit-font-smoothing: antialiased;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #111111; border: 1px solid rgba(255,255,255,0.05); border-collapse: collapse; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="background-color: #000000; text-align: center; padding: 40px 20px; border-bottom: 2px solid #FFD700;">
                <h1 style="margin: 0; font-family: Impact, sans-serif; font-size: 28px; font-style: italic; letter-spacing: -1px; text-transform: uppercase; color: #ffffff; tracking: tight;">
                  A1 <span style="color: #FFD700;">SUPPLEMENTS</span>
                </h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">The Performance Edit</p>
              </td>
            </tr>
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="margin-top: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; font-style: italic; color: #ffffff;">Order Confirmed!</h2>
                <p style="color: #aaaaaa; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                  Hey ${customerName},<br>
                  Thank you for shopping with A1 Supplements! We have received your order and are getting it ready. You can track its progress below.
                </p>

                <!-- Order Info Cards -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="width: 50%; padding-right: 15px; vertical-align: top;">
                      <div style="font-size: 10px; color: #555555; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 5px;">Order Number</div>
                      <div style="font-size: 15px; font-weight: bold; color: #ffffff;">#${order.id}</div>
                    </td>
                    <td style="width: 50%; padding-left: 15px; vertical-align: top;">
                      <div style="font-size: 10px; color: #555555; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 5px;">Payment Method</div>
                      <div style="font-size: 14px; color: #ffffff; font-weight: bold;">${paymentDetails}</div>
                    </td>
                  </tr>
                </table>

                <!-- Items Table -->
                <div style="font-size: 10px; color: #555555; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">Items Ordered</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                  ${itemsListHtml}
                </table>

                <!-- Order Totals -->
                <table style="width: 100%; border-collapse: collapse; background-color: #141414; padding: 15px; margin-bottom: 30px; font-size: 14px; border: 1px solid rgba(255,255,255,0.03);">
                  <tr>
                    <td style="padding: 12px; color: #888888;">Items Total:</td>
                    <td style="padding: 12px; text-align: right; color: #ffffff;">₹${order.total.toLocaleString()}</td>
                  </tr>
                  <tr style="border-top: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px; color: #ffffff; font-weight: bold;">Order Total:</td>
                    <td style="padding: 12px; text-align: right; color: #FFD700; font-size: 18px; font-weight: 900;">₹${order.total.toLocaleString()}</td>
                  </tr>
                </table>

                <!-- Shipping details -->
                <div style="font-size: 10px; color: #555555; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">Fulfillment Information</div>
                <div style="font-size: 14px; line-height: 1.5; color: #dddddd; margin-bottom: 20px;">
                  ${fulfillmentDetails}
                </div>

                ${bankDetailsHtml}

                <!-- Track Button -->
                <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
                  <a href="https://a1supplement.com/track-order" style="background-color: #FFD700; color: #000000; padding: 15px 30px; font-weight: bold; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; display: inline-block; border-radius: 2px;">Track Your Package</a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #000000; text-align: center; padding: 30px 20px; font-size: 11px; color: #555555; border-top: 1px solid rgba(255,255,255,0.05);">
                <p style="margin: 0 0 10px 0;">This email was sent to ${order.customerData.email} because of a purchase on A1 Supplements.</p>
                <p style="margin: 0;">&copy; 2026 A1 Supplements. All Rights Reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

    // 2. ORDER STATUS UPDATED EMAIL
    else if (type === 'status_update') {
      const currentStatus = status || order.status;
      emailSubject = `Order #${order.id} Status Update: ${currentStatus} | A1 Supplements`;
      
      let statusMessage = '';
      let statusColor = '#FFD700';

      if (currentStatus === 'Pending') {
        statusMessage = 'Your payment has been successfully verified! We are now preparing your supplements for packaging and fulfillment.';
        statusColor = '#EAB308'; // yellow
      } else if (currentStatus === 'Shipped') {
        statusMessage = 'Great news! Your package has been handed over to our courier and is officially on its way to your destination.';
        statusColor = '#3B82F6'; // blue
      } else if (currentStatus === 'Delivered') {
        statusMessage = 'Delivered! Your package has arrived at its destination. Enjoy your performance supplements and keep pushing your limits!';
        statusColor = '#22C55E'; // green
      } else {
        statusMessage = `Your order status has been updated to: ${currentStatus}.`;
      }

      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${emailSubject}</title>
        </head>
        <body style="background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px 0; color: #ffffff; -webkit-font-smoothing: antialiased;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #111111; border: 1px solid rgba(255,255,255,0.05); border-collapse: collapse; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="background-color: #000000; text-align: center; padding: 40px 20px; border-bottom: 2px solid ${statusColor};">
                <h1 style="margin: 0; font-family: Impact, sans-serif; font-size: 28px; font-style: italic; letter-spacing: -1px; text-transform: uppercase; color: #ffffff;">
                  A1 <span style="color: ${statusColor};">SUPPLEMENTS</span>
                </h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Status Update</p>
              </td>
            </tr>
            <!-- Main Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <div style="display: inline-block; background-color: ${statusColor}1A; border: 1px solid ${statusColor}; color: ${statusColor}; padding: 6px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-radius: 2px;">
                  Status: ${currentStatus}
                </div>
                
                <h2 style="margin-top: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; font-style: italic; color: #ffffff;">Order Status Updated</h2>
                <p style="color: #aaaaaa; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
                  Hey ${customerName},<br><br>
                  ${statusMessage}
                </p>

                <!-- Order Details Summary -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; background-color: #141414; border: 1px solid rgba(255,255,255,0.03); font-size: 13px; color: #cccccc;">
                  <tr>
                    <td style="padding: 12px; color: #888888;">Order Number:</td>
                    <td style="padding: 12px; text-align: right; color: #ffffff; font-weight: bold;">#${order.id}</td>
                  </tr>
                  <tr style="border-top: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px; color: #888888;">Order Items:</td>
                    <td style="padding: 12px; text-align: right; color: #ffffff;">${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                  </tr>
                  <tr style="border-top: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px; color: #888888;">Total Amount:</td>
                    <td style="padding: 12px; text-align: right; color: #FFD700; font-weight: bold;">₹${order.total.toLocaleString()}</td>
                  </tr>
                </table>

                <!-- Track Button -->
                <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
                  <a href="https://a1supplement.com/track-order" style="background-color: ${statusColor}; color: #000000; padding: 15px 30px; font-weight: bold; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; display: inline-block; border-radius: 2px;">Track Your Order</a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #000000; text-align: center; padding: 30px 20px; font-size: 11px; color: #555555; border-top: 1px solid rgba(255,255,255,0.05);">
                <p style="margin: 0 0 10px 0;">This email was sent to ${order.customerData.email} regarding Order #${order.id}.</p>
                <p style="margin: 0;">&copy; 2026 A1 Supplements. All Rights Reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'A1 Supplements <support@a1supplement.com>',
        to: order.customerData.email,
        subject: emailSubject,
        html: emailHtml
      })
    const data = await response.json();

    // Trigger Discord Webhook Notification securely from the serverless side
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (type === 'new_order' && discordWebhookUrl) {
      try {
        const itemsList = order.items.map(item => `- ${item.quantity}x ${item.name} (₹${item.price})`).join('\n');
        const paymentMethodName = order.paymentMethod === 'cod' ? 'Cash on Delivery 💵' : (order.paymentMethod === 'bank' ? 'Bank Transfer 🏦' : 'Card / UPI 💳');
        const fulfillmentName = order.fulfillmentType === 'pickup' ? 'Store Pickup 🏪' : 'Home Delivery 🚚';
        const fulfillmentLoc = order.fulfillmentType === 'pickup' 
          ? order.customerData.pickupLocation || 'Main Store' 
          : `${order.customerData.address}, ${order.customerData.city}, ${order.customerData.region || ''} (${order.customerData.zipCode || ''})`;

        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title: "🔔 New Order Received!",
                color: 16768000,
                fields: [
                  { name: "Customer", value: `${order.customerData.firstName} ${order.customerData.lastName}\n📧 ${order.customerData.email}\n📞 ${order.customerData.phone || 'N/A'}`, inline: true },
                  { name: "Fulfillment", value: `${fulfillmentName}\n📍 ${fulfillmentLoc}`, inline: true },
                  { name: "Payment Method", value: paymentMethodName, inline: true },
                  { name: "Order Total", value: `**₹${order.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}**`, inline: true },
                  { name: "Items", value: itemsList || "No items" }
                ],
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (discordErr) {
        console.error("Failed to send Discord notification:", discordErr);
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
