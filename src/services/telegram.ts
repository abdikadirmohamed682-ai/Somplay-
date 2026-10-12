import { Order, TelegramSettings } from '../types';

const sentNotificationKeys = new Set<string>();

export async function sendTelegramNotification(
  settings: TelegramSettings,
  event: 
    | 'new_efootball_order'
    | 'code_submitted'
    | 'verification_approved'
    | 'verification_rejected'
    | 'pubg_final_order'
    | 'payment_submitted'
    | 'payment_confirmed'
    | 'status_changed',
  order: Order,
  extraMessage?: string
): Promise<{ success: boolean; message: string }> {
  if (!settings.enabled || !settings.botToken || !settings.chatId) {
    return {
      success: false,
      message: 'Telegram lama shaqaysiin ama Bot Token / Chat ID ma buuxa.',
    };
  }

  // Deduplication check
  const eventKey = `${order.id}:${event}:${order.status}:${order.senderPhoneNumber || ''}:${extraMessage || ''}`;
  if (sentNotificationKeys.has(eventKey)) {
    return { success: true, message: 'Fariintaan mar hore ayaa la diray (Deduplicated).' };
  }

  // Filter based on event toggles
  if (event === 'new_efootball_order' && !settings.notifyOnNewEfootballOrder) return { success: false, message: 'Disabled by settings' };
  if (event === 'code_submitted' && !settings.notifyOnCodeSubmitted) return { success: false, message: 'Disabled by settings' };
  if (event === 'verification_approved' && !settings.notifyOnVerificationApproved) return { success: false, message: 'Disabled by settings' };
  if (event === 'verification_rejected' && !settings.notifyOnVerificationRejected) return { success: false, message: 'Disabled by settings' };
  if (event === 'pubg_final_order' && !settings.notifyOnFinalPubgOrder) return { success: false, message: 'Disabled by settings' };
  if (event === 'payment_submitted' && !settings.notifyOnPaymentSubmitted) return { success: false, message: 'Disabled by settings' };
  if (event === 'payment_confirmed' && !settings.notifyOnPaymentConfirmed) return { success: false, message: 'Disabled by settings' };
  if (event === 'status_changed') {
    if (order.status === 'Waa la dhammaystiray' && !settings.notifyOnOrderCompleted) return { success: false, message: 'Disabled by settings' };
    if (order.status === 'Wuu fashilmay' && !settings.notifyOnOrderFailed) return { success: false, message: 'Disabled by settings' };
  }

  // Compose concise Somali notification without leaking verification codes
  let eventTitle = 'Dalab Cusub';
  if (event === 'new_efootball_order') {
    eventTitle = '⚽ Dalab Cusub (eFootball - Sugaya Xaqiijin)';
  } else if (event === 'code_submitted') {
    eventTitle = '📩 Macmiilku Wuxuu Soo Gudbiyay Koodh (Hubin ku socoto)';
  } else if (event === 'verification_approved') {
    eventTitle = '✅ Xaqiijinta Waa La Oggolaaday (Sugaya Lacag-bixin)';
  } else if (event === 'verification_rejected') {
    eventTitle = '❌ Xaqiijinta Waa La Diiday (Xaqiijintu way fashilantay)';
  } else if (event === 'pubg_final_order') {
    eventTitle = '🎮 Dalabka PUBG Mobile Waa La Gudbiyay (Sugaya Hubin)';
  } else if (event === 'payment_submitted') {
    eventTitle = '💳 Lacag-bixin Cusub Ayaa La Soo Gudbiyay (Sugaya Hubin)';
  } else if (event === 'payment_confirmed') {
    eventTitle = '💵 Lacag-bixinta Waa La Xaqiijiyay (Waa la shaqaynayaa)';
  } else if (event === 'status_changed') {
    if (order.status === 'Waa la dhammaystiray') eventTitle = '🎉 Dalabka Waa La Dhammaystiray';
    else if (order.status === 'Wuu fashilmay') eventTitle = '⚠️ Dalabka Wuu Fashilmay';
    else eventTitle = `ℹ️ Xaaladda Dalabka: ${order.status}`;
  }

  const textLines = [
    `🔔 *SOMTOPUP OGEYSIIS*`,
    `*${eventTitle}*`,
    `━━━━━━━━━━━━━━━━━━`,
    `📋 *Tirsiga Dalabka:* \`${order.id}\``,
    `🎮 *Ciyaarta:* ${order.game}`,
    `📦 *Xirmada:* ${order.packageName}`,
    `💰 *Qiimaha:* $${order.price.toFixed(2)}`,
    `🆔 *Player ID:* \`${order.playerId}\``,
  ];

  if (order.playerNickname) {
    textLines.push(`👤 *Nickname:* ${order.playerNickname}`);
  }
  if (order.email) {
    textLines.push(`📧 *Email:* ${order.email}`);
  }
  if (order.paymentMethodName) {
    textLines.push(`🏦 *Habka Lacagta:* ${order.paymentMethodName}`);
  }
  if (order.senderPhoneNumber) {
    textLines.push(`📱 *Lambarka Laga Soo Diray:* \`${order.senderPhoneNumber}\``);
  }
  textLines.push(`📊 *Xaaladda:* ${order.status}`);
  textLines.push(`⏰ *Waqtiga:* ${new Date(order.updatedAt || order.createdAt).toLocaleTimeString('en-US', { hour12: true })}`);

  if (order.failureReason) {
    textLines.push(`⚠️ *Sababta Fashilka:* ${order.failureReason}`);
  }
  if (extraMessage) {
    textLines.push(`📝 *Qoraal Dheeraad ah:* ${extraMessage}`);
  }

  const messageText = textLines.join('\n');

  try {
    const url = `https://api.telegram.org/bot${settings.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });

    if (response.ok) {
      sentNotificationKeys.add(eventKey);
      return { success: true, message: 'Ogeysiiska Telegram si guul leh ayaa loo diray.' };
    } else {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Telegram khalad: ${errData.description || response.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Khalad dirista Telegram: ${error.message || 'Network error'}`,
    };
  }
}

export async function testTelegramConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
  if (!botToken || !chatId) {
    return { success: false, message: 'Fadlan geli Bot Token iyo Chat ID sax ah.' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const text = `🔔 *SomTopUp Tijaabo*\nKani waa fariin tijaabo ah oo ka timid nidaamka SomTopUp. Bot-ku wuu shaqaynayaa! ✅`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });

    if (res.ok) {
      return { success: true, message: 'Tijaabadii Telegram way guuleysatay! Fariin ayaa soo gaartay kooxdaada.' };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: `Telegram khalad: ${err.description || res.statusText}` };
    }
  } catch (err: any) {
    return { success: false, message: `Ma suuragelin in lala xiriiro Telegram: ${err.message}` };
  }
}
