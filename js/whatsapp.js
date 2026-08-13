/* ==========================================================================
   VERSTAIL - WEB: WHATSAPP ORDER FORWARDING ENGINE
   Formats order details in Spanish and launches direct wa.me link
   ========================================================================== */

function formatWhatsAppOrderMessage(order, settings) {
  const storeName = settings.storeName || 'Versátil';
  
  let msg = `🍹 *NUEVO PEDIDO - ${storeName.toUpperCase()}* 🍹\n`;
  msg += `----------------------------------\n`;
  msg += `📋 *Orden:* #${order.id}\n`;
  msg += `👤 *Cliente:* ${order.customerName}\n`;
  msg += `📞 *Teléfono:* ${order.customerPhone}\n`;
  if (order.customerEmail && order.customerEmail.trim()) {
    msg += `📧 *Email:* ${order.customerEmail}\n`;
  }
  
  msg += `\n🛒 *DETALLE DEL PEDIDO:* \n`;
  msg += `----------------------------------\n`;

  let totalAmount = 0;
  let hasPrices = false;

  order.items.forEach((item, index) => {
    msg += `\n*${index + 1}. ${item.name}* (x${item.quantity})\n`;
    if (item.size) msg += `   • *Tamaño:* ${item.size}\n`;
    if (item.mode) msg += `   • *Opción:* ${item.mode.toUpperCase()}\n`;
    if (item.base && item.base.length > 0) {
      msg += `   • *Base:* ${Array.isArray(item.base) ? item.base.join(' + ') : item.base}\n`;
    }
    if (item.flavors && item.flavors.length > 0) {
      msg += `   • *Sabores:* ${item.flavors.join(', ')}\n`;
    }
    if (item.ingredients && item.ingredients.length > 0) {
      msg += `   • *Ingredientes:* ${item.ingredients.join(', ')}\n`;
    }
    if (item.extras && item.extras.length > 0) {
      msg += `   • *Extras:* ${item.extras.join(', ')}\n`;
    }
    if (item.showPublicPrice && item.unitPrice > 0) {
      hasPrices = true;
      const itemSubtotal = item.unitPrice * item.quantity;
      totalAmount += itemSubtotal;
      msg += `   • *Precio:* $${itemSubtotal.toFixed(2)}\n`;
    }
  });

  msg += `\n----------------------------------\n`;
  if (hasPrices) {
    msg += `💰 *TOTAL CALCULADO:* $${totalAmount.toFixed(2)}\n`;
  } else {
    msg += `💰 *PRECIO:* Se confirmará en WhatsApp\n`;
  }
  msg += `----------------------------------\n`;
  msg += `¡Gracias por elegir Verstail! "Tu bebida. Tu mezcla. Tu estilo."`;

  return msg;
}

function generateWhatsAppLink(order, settings) {
  let targetPhone = settings.whatsappPhone || '19393120599';
  targetPhone = targetPhone.replace(/\D/g, '');
  const textMessage = formatWhatsAppOrderMessage(order, settings);
  const encodedText = encodeURIComponent(textMessage);
  return `https://wa.me/${targetPhone}?text=${encodedText}`;
}

async function sendDirectWhatsAppNotification(order, settings) {
  const waUrl = generateWhatsAppLink(order, settings);
  try {
    if (settings.callMeBotApiKey) {
      const targetPhone = (settings.whatsappPhone || '19393120599').replace(/\D/g, '');
      const msg = encodeURIComponent(formatWhatsAppOrderMessage(order, settings));
      const apiEndpoint = `https://api.callmebot.com/whatsapp.php?phone=+${targetPhone}&text=${msg}&apikey=${settings.callMeBotApiKey}`;
      fetch(apiEndpoint, { mode: 'no-cors' }).catch(() => {});
    }
  } catch (e) {
    console.log('Direct notification error:', e);
  }
  return waUrl;
}

function formatBareMinimumOrderMessage(order, settings) {
  const storeName = settings.storeName || 'Versátil';
  
  let msg = `🍹 *NUEVO PEDIDO #${order.id} - ${storeName.toUpperCase()}*\n`;
  msg += `👤 *Cliente:* ${order.customerName}\n`;
  msg += `📞 *Teléfono:* ${order.customerPhone}\n`;
  if (order.customerEmail && order.customerEmail.trim()) {
    msg += `📧 *Email:* ${order.customerEmail.trim()}\n`;
  }
  msg += `\n🛒 *ITEMS:* \n`;

  order.items.forEach((item, index) => {
    msg += `${index + 1}. *${item.name}* (x${item.quantity}) - ${item.size || 'Estándar'}\n`;
    if (item.flavors && item.flavors.length > 0) {
      msg += `   • Frutas: ${item.flavors.join(', ')}\n`;
    }
    if (item.extras && item.extras.length > 0) {
      msg += `   • Extras: ${item.extras.join(', ')}\n`;
    }
  });

  return msg;
}

async function sendBackgroundWhatsAppNotification(order, settings) {
  const messageText = formatBareMinimumOrderMessage(order, settings);
  const targetPhone = (settings.whatsappPhone || '19393120599').replace(/\D/g, '');

  // 1. Check CallMeBot API Key (Free, 30-sec setup, no Meta developer account needed!)
  if (settings.callMeBotApiKey && settings.callMeBotApiKey.trim()) {
    try {
      const encodedMsg = encodeURIComponent(messageText);
      const url = `https://api.callmebot.com/whatsapp.php?phone=+${targetPhone}&text=${encodedMsg}&apikey=${settings.callMeBotApiKey.trim()}`;
      fetch(url, { mode: 'no-cors' }).catch(() => {});
      return { success: true, method: 'callmebot' };
    } catch (e) {
      console.log('CallMeBot dispatch error:', e);
    }
  }

  // 2. Check Meta Cloud API (if configured)
  const phoneId = settings.metaPhoneId;
  const apiToken = settings.metaApiToken;

  if (phoneId && apiToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'text',
          text: { body: messageText }
        })
      });
      const data = await response.json();
      return { success: true, method: 'meta_cloud_api', data };
    } catch (e) {
      console.error('Meta Cloud API Error:', e);
    }
  }

  // 3. Server endpoint relay fallback
  try {
    const res = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, settings, messageText })
    });
    if (res.ok) {
      return { success: true, method: 'server_relay' };
    }
  } catch (e) {
    console.log('Server relay fallback:', e);
  }

  return { success: false, method: 'fallback' };
}

window.VerstailWhatsApp = {
  formatWhatsAppOrderMessage,
  formatBareMinimumOrderMessage,
  generateWhatsAppLink,
  sendDirectWhatsAppNotification,
  sendBackgroundWhatsAppNotification,
  sendMetaWhatsAppCloudNotification: sendBackgroundWhatsAppNotification
};
