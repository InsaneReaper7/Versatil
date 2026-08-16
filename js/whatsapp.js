/* ==========================================================================
   VERSTAIL - WEB: WHATSAPP ORDER FORWARDING ENGINE
   Formats order details in Spanish and launches direct wa.me link
   ========================================================================== */

function formatItemBaseText(item) {
  if (item.removedBase && Array.isArray(item.removedBase)) {
    if (item.removedBase.length === 0) return 'Como Sale';
    return item.removedBase.map(r => `Sin ${r}`).join(', ');
  }

  const defaultBaseMap = {
    'mega-te': ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
    'versa-to-go': ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'],
    'batidas': ['Proteína Nutricional'],
    'yogurt': ['Yogurt Cremoso', 'Fresas Frescas', 'Guineo Sliced', 'Blueberries', 'Granola Crunch'],
    'galletas': ['Mezcla Proteica Horneada'],
    'donas': ['Maza Fit']
  };

  const defaultBase = item.defaultBase || defaultBaseMap[item.category] || ['Mega Té Concentrado', 'Aloe Vera', 'Lift Off', 'Colágeno'];
  const activeIngredients = item.ingredients || item.base;

  if (Array.isArray(activeIngredients)) {
    const removed = defaultBase.filter(b => !activeIngredients.includes(b));
    if (removed.length === 0) {
      return 'Como Sale';
    }
    return removed.map(r => `Sin ${r}`).join(', ');
  }

  return 'Como Sale';
}

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
    msg += `   • *Base:* ${formatItemBaseText(item)}\n`;
    if (item.flavors && item.flavors.length > 0) {
      msg += `   • *Frutas/Sabores:* ${item.flavors.join(', ')}\n`;
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
  msg += `¡Gracias por elegir Versátil! "Tu bebida. Tu mezcla. Tu estilo."`;

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
    msg += `   • Base: ${formatItemBaseText(item)}\n`;
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

  // 1. Send via Server Relay Endpoint (bypasses browser CORS, ad-blockers, and client network blocks)
  try {
    const res = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, settings, messageText })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'sent') {
        return { success: true, method: 'server_relay', data };
      }
    }
  } catch (e) {
    console.log('Server relay error:', e);
  }

  // 2. Direct CallMeBot Browser Fallback
  if (settings.callMeBotApiKey && settings.callMeBotApiKey.trim()) {
    try {
      const encodedMsg = encodeURIComponent(messageText);
      const url = `https://api.callmebot.com/whatsapp.php?phone=+${targetPhone}&text=${encodedMsg}&apikey=${settings.callMeBotApiKey.trim()}`;
      fetch(url, { mode: 'no-cors' }).catch(() => {});
      return { success: true, method: 'callmebot_direct' };
    } catch (e) {
      console.log('CallMeBot direct dispatch error:', e);
    }
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
