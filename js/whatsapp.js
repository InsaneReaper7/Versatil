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
  let targetPhone = settings.whatsappPhone || '17875550199';
  // Strip non-digit characters
  targetPhone = targetPhone.replace(/\D/g, '');
  
  const textMessage = formatWhatsAppOrderMessage(order, settings);
  const encodedText = encodeURIComponent(textMessage);
  
  return `https://wa.me/${targetPhone}?text=${encodedText}`;
}

window.VerstailWhatsApp = {
  formatWhatsAppOrderMessage,
  generateWhatsAppLink
};
