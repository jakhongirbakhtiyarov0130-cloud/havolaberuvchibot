/* SOZLAMALAR */

// 1. Telegram Bot Tokeningizni kiriting
// IZOH: Bu joyga o'zingizning @BotFather dan olgan BOT TOKENINGIZNI kiriting.
const TOKEN = "YOUR_BOT_TOKEN_HERE"; 

// 2. Admin (Tasdiqlovchi) shaxsiy ID raqamini kiriting
// IZOH: Obunalarni tasdiqlovchi adminning shaxsiy chat ID'si. /admin buyrug'i faqat shu ID uchun ishlaydi.
const ADMIN_CHAT_ID = "YOUR_ADMIN_CHAT_ID"; 

// 3. Obuna qilinadigan yopiq guruh ID raqami (manfiy son bo'lishi shart)
// IZOH: Foydalanuvchi obuna bo'lishi kerak bo'lgan guruhning ID'si (masalan, -100xxxxxxxxxx).
const TARGET_GROUP_ID = "YOUR_TARGET_GROUP_ID"; 

// 4. Ma'lumotlar bazasi (Google Sheets) ID raqami
// IZOH: Google Sheet URL'sida mavjud bo'lgan ID (masalan, .../d/ID_RAQAM/edit).
const SS_ID = "YOUR_SPREADSHEET_ID"; 
const SHEET_NAME = "Users"; // Ma'lumotlar saqlanadigan sahifa nomi

// Umumiy sozlamalar
const BOT_URL = "https://api.telegram.org/bot" + TOKEN;
const PRICE_UZS = "150,000"; // Obuna narxi
const CARD_NUMBER = "8600 XXXX XXXX 1234"; // To'lov qabul qilinadigan karta raqami


/* YORDAMCHI FUNKSIYALAR: TELEGRAM & GOOGLE SHEETS */

/**
 * Google Sheets (DB) bilan ishlash
 * IZOH: Sheet'ni topadi yoki mavjud bo'lmasa, yangi 'Users' sahifasini yaratadi.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SS_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // [0] ID, [1] Chek File ID, [2] Status, [3] Link Ishlatilgan, [4] Oxirgi Xabar ID
    sheet.appendRow(["telegram_id", "chek_file_id", "status", "link_used", "last_msg_id"]); 
  }
  return sheet;
}

/**
 * Telegramga xabar yuborish (Yuborilgan xabar ID'sini qaytaradi)
 * IZOH: HTML formatlashni qo'llab-quvvatlaydigan standart xabar yuborish funksiyasi.
 * @returns {string|null} - Yangi xabar ID'si
 */
function sendMessage(chatId, text, keyboard = null, isHtml = true) {
  const payload = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(chatId),
      text: text,
      parse_mode: isHtml ? "HTML" : undefined,
      reply_markup: keyboard ? JSON.stringify(keyboard) : undefined
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(BOT_URL + "/sendMessage", payload);
    const jsonResponse = JSON.parse(response.getContentText());
    if (jsonResponse.ok) {
      return jsonResponse.result.message_id; // Yangi xabar ID'sini qaytarish
    }
  } catch(e) {
    Logger.log("SendMessage xatosi: " + e.toString());
  }
  return null;
}

/**
 * Rasmni (chekni) adminlarga yuborish
 * IZOH: Tasdiqlash uchun foydalanuvchi yuborgan chek rasmini admin chatiga yuboradi.
 */
function sendPhoto(chatId, fileId, caption, keyboard = null) {
  const payload = {
    method: "post",
    payload: {
      method: "sendPhoto",
      chat_id: String(chatId),
      photo: fileId,
      caption: caption,
      parse_mode: "HTML",
      reply_markup: keyboard ? JSON.stringify(keyboard) : undefined
    }
  };
  // Bu funksiya xatoliklarni ushlamasdan to'g'ridan-to'g'ri ishlatiladi.
  UrlFetchApp.fetch(BOT_URL + "/sendPhoto", payload);
}

/**
 * Xabardagi tugmalarni tahrirlash
 * IZOH: Asosan admin panelida tugmalarni yangilash uchun ishlatiladi.
 */
function editMessageText(chatId, messageId, text, keyboard = null) {
  const payload = {
    method: "post",
    payload: {
      method: "editMessageText",
      chat_id: String(chatId),
      message_id: messageId,
      text: text,
      parse_mode: "HTML",
      reply_markup: keyboard ? JSON.stringify(keyboard) : undefined
    }
  };
  // Bu funksiya xatoliklarni ushlamasdan to'g'ridan-to'g'ri ishlatiladi.
  UrlFetchApp.fetch(BOT_URL + "/editMessageText", payload);
}

/**
 * Xabarni o'chiradi (Chatni tozalash uchun)
 * IZOH: Foydalanuvchi interfeysini toza saqlash uchun avvalgi bot xabarini o'chiradi.
 */
function deleteMessage(chatId, messageId) {
  try {
    const url = BOT_URL + "/deleteMessage";
    const payload = {
      method: "post",
      payload: {
        method: "deleteMessage",
        chat_id: String(chatId),
        message_id: messageId
      }
    };
    UrlFetchApp.fetch(url, payload);
  } catch (e) {
    // Ba'zan bot o'chirila olmaydigan xabarga duch kelishi mumkin, shuning uchun try-catch.
    Logger.log("Xabarni o'chirishda xato (mumkin): " + e.toString());
  }
}

/**
 * CallbackQuery ni yopish
 * IZOH: Inline tugma bosilganda foydalanuvchiga kichik bildirishnoma ko'rsatadi (yoki ko'rsatmaydi).
 */
function answerCallbackQuery(callbackQueryId, text) {
  const payload = {
    method: "post",
    payload: {
      method: "answerCallbackQuery",
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: false // Kichik, vaqtincha bildirishnoma
    }
  };
  UrlFetchApp.fetch(BOT_URL + "/answerCallbackQuery", payload);
}

/**
 * Foydalanuvchini yopiq guruhga qo'shish uchun bir martalik havola yaratish
 * IZOH: `createChatInviteLink` metodi orqali a'zo limiti 1 bo'lgan havolani yaratadi.
 * @param {string} groupId - Guruh ID'si
 * @returns {string|null} - Taklif havolasi URL'si
 */
function createOneTimeInviteLink(groupId) {
  const linkUrl = BOT_URL + "/createChatInviteLink";
  const payload = {
    method: "post",
    payload: {
      method: "createChatInviteLink",
      chat_id: groupId,
      member_limit: 1 // Bir martalik ishlatiladigan havola
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(linkUrl, payload);
    const json = JSON.parse(response.getContentText());
    if (json.ok) {
      return json.result.invite_link; 
    } else {
      Logger.log("Guruhga kirish havolasini yaratishda xato: " + json.description);
      return null;
    }
  } catch(e) {
      Logger.log("createChatInviteLink xatosi: " + e.toString());
      return null;
  }
}

/**
 * Google Sheets'dan foydalanuvchi ma'lumotlarini topish
 * IZOH: Telegram ID bo'yicha ma'lumotlar qatorini (row) topadi.
 * @param {string} userId - Telegram foydalanuvchi ID'si
 * @returns {Object|null} - Foydalanuvchi ma'lumotlari va Sheets qatori (row) raqami
 */
function findUserRow(userId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userId) {
      return {
        row: i + 1,
        status: data[i][2],
        linkUsed: data[i][3],
        lastMsgId: data[i][4],
        chekFileId: data[i][1]
      };
    }
  }
  return null;
}

/**
 * Foydalanuvchi statusini Sheets'da yangilash
 * IZOH: 'Yangi', 'Kutishda', 'Tasdiqlandi', 'Rad etildi' kabi statuslarni o'rnatadi.
 * @param {string} userId - Telegram ID
 * @param {string} status - Yangi status
 * @returns {boolean} - Muvaffaqiyatli yangilanganligi
 */
function updateStatusInSheet(userId, status) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userId) {
      sheet.getRange(i + 1, 3).setValue(status);
      return true;
    }
  }
  return false;
}

/**
 * Havola ishlatilganligini Sheets'da belgilash
 * IZOH: Bir martalik havola ishlatilgandan so'ng, xavfsizlik uchun TRUE ga o'rnatiladi.
 */
function setLinkUsedStatus(userId, used) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == userId) {
      sheet.getRange(i + 1, 4).setValue(used);
      return true;
    }
  }
  return false;
}

/**
 * Xabar ID'sini Sheets'da yangilash
 * IZOH: Foydalanuvchi bilan so'nggi bot xabarini o'chirish (deleteMessage) uchun ID saqlanadi.
 */
function updateLastMsgId(userId, messageId) {
    const sheet = getSheet();
    const userData = findUserRow(userId);
    if (userData) {
        // 5-ustun - last_msg_id
        sheet.getRange(userData.row, 5).setValue(messageId);
    }
}

/**
 * Botning username'ini olish
 * IZOH: /start yordamida noyob havola yaratish uchun zarur. Bir marta API'dan so'raladi.
 * @returns {string} - Botning username'i
 */
let botUsername = null;
function getBotUsername() {
  if (botUsername) return botUsername;
  try {
    const response = UrlFetchApp.fetch(BOT_URL + "/getMe");
    const json = JSON.parse(response.getContentText());
    if (json.ok) {
      botUsername = json.result.username;
      return botUsername;
    }
  } catch (e) {
    Logger.log("Bot username'ini olishda xato: " + e.toString());
  }
  return "BOT_USERNAME_QO'LDA_KIRITING"; 
}


/* ASOSIY FUNKSIYALAR */

/**
 * Google Apps Script Webhook kirish nuqtasi
 * IZOH: Telegram'dan kelgan barcha POST so'rovlarni (xabarlar va callback'lar) qabul qiladi.
 */
function doPost(e) {
  if (!e || !e.postData) {
    Logger.log("Ogohlantirish: So'rov qo'lda yoki Webhook orqali emas, POST ma'lumotlarsiz keldi.");
    return;
  }
  
  try {
    const update = JSON.parse(e.postData.contents);
    if (update.message) {
      handleMessage(update); // Oddiy xabarlar (matn, rasm)
    } else if (update.callback_query) {
      handleCallback(update.callback_query); // Inline tugmalar bosilishi
    }
  } catch (error) {
    Logger.log("Xatolik yuz berdi: " + error.toString());
  }
}

/**
 * Xabarlarga ishlov berish
 * IZOH: /start, /obuna, /admin buyruqlari va chek rasmlariga javob beradi.
 */
function handleMessage(update) {
  const message = update.message;
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  
  const userData = findUserRow(userId);
  
  // 1. Interfeysni tozalash mantiqi: avvalgi bot xabarini o'chirish
  if (userData && userData.lastMsgId) {
    deleteMessage(chatId, userData.lastMsgId);
  }

  // A. Matnli xabarlar
  if (text) {
    
    // /start yoki /obuna buyrug'i (To'lov ma'lumotlarini ko'rsatadi)
    if (text === "/start" || text === "/obuna") {
      const paymentInfo = 
        `🔑 **Yopiq guruhga obuna bo'lish:**\nNarxi: ${PRICE_UZS} UZS\n\n` +
        `💳 **Plastik karta raqami:** <code>${CARD_NUMBER}</code>\n` +
        `Eslatma: To'lovdan so'ng **chekning rasmini** shu botga yuboring.`;
      
      const newMessageId = sendMessage(chatId, paymentInfo);
      
      if (!userData) {
        // Yangi foydalanuvchi: DB'ga yozish
        getSheet().appendRow([userId, "", "Yangi", false, newMessageId]); 
      } else {
        // Avvalgi foydalanuvchi: Oxirgi xabar ID'sini yangilash
        getSheet().getRange(userData.row, 5).setValue(newMessageId);
      }
      return;
    }
    
    // /admin paneliga kirish
    if (text === "/admin") {
      if (String(userId) !== String(ADMIN_CHAT_ID)) {
        sendMessage(chatId, "🚫 Sizda admin huquqi yo'q.");
        return;
      }
      showAdminPanel(userId); 
      return;
    }
    
    // B. Maxsus xavfsiz havola orqali kirish (/start INVITE_...)
    // IZOH: Bu joyda bir martalik havola yaratiladi va darhol ishlatilgan deb belgilanadi.
    if (text.startsWith("/start ")) {
        const payload = text.substring(7);
        if (payload.startsWith("INVITE_")) {
            
            // Faqat statusi 'Tasdiqlandi' va 'linkUsed' FALSE bo'lsa kirishga ruxsat
            if (userData && userData.status === 'Tasdiqlandi' && !userData.linkUsed) {
                
                // 1. Bir martalik havolani yaratish
                const permanentInviteLink = createOneTimeInviteLink(TARGET_GROUP_ID); 
                
                // 2. Darhol Sheets'da havolani ISHLATILGAN deb belgilash (Xavfsizlik)
                setLinkUsedStatus(userId, true); 

                if (permanentInviteLink) {
                    const newMessageId = sendMessage(chatId, 
                      `🎉 **Guruhga kirish havolasi yaratildi!** Endi guruhga kiring.`,
                      { inline_keyboard: [[{ text: "Guruhga kirish", url: permanentInviteLink }]] }
                    );
                    updateLastMsgId(userId, newMessageId);

                } else {
                    const newMessageId = sendMessage(chatId, "Guruhga kirish havolasini yaratishda xatolik yuz berdi. Botning guruhda 'Taklif havolalarini boshqarish' huquqi borligiga ishonch hosil qiling.");
                    updateLastMsgId(userId, newMessageId);
                }
            } else if (userData && userData.linkUsed) {
                const newMessageId = sendMessage(chatId, "⚠️ Bu havoladan allaqachon foydalanilgan. U faqat bir marta ishlaydi.");
                updateLastMsgId(userId, newMessageId);
            } else {
                const newMessageId = sendMessage(chatId, "🚫 Sizning obunangiz hali tasdiqlanmagan yoki rad etilgan. Iltimos, /obuna bosing.");
                updateLastMsgId(userId, newMessageId);
            }
            return;
        }
    }
    
    // Boshqa matnlar uchun standart javob
    const newMessageId = sendMessage(chatId, "Noto'g'ri buyruq. Iltimos, /start yoki /obuna buyrug'ini bosing.");
    updateLastMsgId(userId, newMessageId);
    return;
  }
  
  // 2. Rasm (Chek) kelganligini tekshirish
  if (message.photo) {
    // Eng katta o'lchamdagi rasm file_id'sini olish
    const fileId = message.photo[message.photo.length - 1].file_id;
    
    if (!userData) {
      // Yangi foydalanuvchi: DB'ga yozish
      getSheet().appendRow([userId, fileId, 'Kutishda', false, null]); 
    } else {
      // Avvalgi foydalanuvchi: chek ID va statusni yangilash
      const sheet = getSheet();
      sheet.getRange(userData.row, 2).setValue(fileId);
      sheet.getRange(userData.row, 3).setValue('Kutishda');
    }

    const newMessageId = sendMessage(userId, "✅ Chekingiz qabul qilindi. Admin paneliga qo'shildi. Iltimos, /admin orqali tasdiqlashni kuting.");
    updateLastMsgId(userId, newMessageId);
    return;
  }
}

/**
 * Inline tugmalar (callback_query) bosilishiga ishlov berish
 * IZOH: Admin panelidagi 'view', 'approve', 'reject', 'refresh' tugmalarini boshqaradi.
 */
function handleCallback(callbackQuery) {
  const data = callbackQuery.data;
  const adminId = callbackQuery.from.id;
  const messageId = callbackQuery.message.message_id;
  const chatId = callbackQuery.message.chat.id;

  // Faqat admin uchun ruxsat
  if (String(adminId) !== String(ADMIN_CHAT_ID)) {
    answerCallbackQuery(callbackQuery.id, "Siz admin emassiz.");
    return;
  }

  const parts = data.split('_'); 
  const action = parts[0]; 
  const targetUserId = parts[1]; // Ta'sir qilinishi kerak bo'lgan foydalanuvchi ID'si

  // A. Panelni Yangilash
  if (action === 'refresh') { 
    showAdminPanel(adminId, messageId); 
    answerCallbackQuery(callbackQuery.id, "Panel yangilandi.");
    return;
  }
  
  // B. Obunani ko'rish (view_12345)
  if (action === 'view') {
    const userData = findUserRow(targetUserId); 
    if (!userData || !userData.chekFileId) {
        answerCallbackQuery(callbackQuery.id, "Obuna ma'lumotlari yoki chek topilmadi.");
        return;
    }
    
    // Chekni tasdiqlash tugmalari
    const viewKeyboard = {
      inline_keyboard: [
        [
          { text: "✅ Qabul qilish", callback_data: `approve_${targetUserId}` },
          { text: "❌ Rad etish", callback_data: `reject_${targetUserId}` }
        ],
        [{ text: "🔙 Panelga Qaytish", callback_data: `refresh_admin` }]
      ]
    };
    
    const caption = `[TASDIQLASH UCHUN]\nID: ${targetUserId}\nTekshiring:`;
    
    // Admin chatiga chek rasmini yuborish
    sendPhoto(adminId, userData.chekFileId, caption, viewKeyboard);
    answerCallbackQuery(callbackQuery.id, `ID ${targetUserId} cheki yuborildi.`);
    return;
  }
  
  // C. Tasdiqlash ('approve') va Rad etish ('reject')
  if (action === 'approve' || action === 'reject') {
      updateStatusInSheet(targetUserId, action === 'approve' ? 'Tasdiqlandi' : 'Rad etildi');

      if (action === 'approve') {
        const botUsername = getBotUsername();
        // XAVFSIZ bot havolasi yaratiladi. Guruh havolasi emas!
        const uniqueLink = `https://t.me/${botUsername}?start=INVITE_${targetUserId}`; 
        
        // Foydalanuvchiga tasdiqlandi xabari va noyob havola yuboriladi
        sendMessage(targetUserId, 
          `🎉 **To'lovingiz tasdiqlandi!** Guruhga kirish uchun pastdagi tugmani bosing.\n` +
          `**Muhim:** Bu tugma faqat bir marta ishlaydi!`,
          { inline_keyboard: [[{ text: "Guruhga kirish", url: uniqueLink }]] }
        );
        
        // Admin xabarini tahrirlash (Chek rasmi emas, panel xabari tahrirlanadi)
        editMessageText(chatId, messageId, `✅ Tasdiqlandi. ID: ${targetUserId} ga xavfsiz havola yuborildi.`);
      } else {
        // Foydalanuvchiga rad etildi xabari yuboriladi
        sendMessage(targetUserId, "❌ Chekingiz rad etildi. Iltimos, to'g'ri chek yuboring.");
        editMessageText(chatId, messageId, `❌ Rad etildi. ID: ${targetUserId} ga xabar yuborildi.`);
      }

      // Admin panelini yangilash
      showAdminPanel(adminId);
      answerCallbackQuery(callbackQuery.id, action === 'approve' ? "Tasdiqlandi" : "Rad etildi");
  }
}

/**
 * Admin panelini (kutishdagi obunalarni) ko'rsatish
 * IZOH: Kutishda turgan foydalanuvchilar ro'yxatini inline tugmalar orqali ko'rsatadi.
 */
function showAdminPanel(adminId, messageId = null) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  let pendingCount = 0;
  let keyboardButtons = [];
  
  // Kutishdagi obunalarni izlash
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'Kutishda') { 
      const targetUserId = data[i][0];
      pendingCount++;
      keyboardButtons.push([{ 
        text: `👤 ID: ${targetUserId}`, 
        callback_data: `view_${targetUserId}` // Ko'rish tugmasi
      }]);
      
      // Ro'yxatni 10 ta bilan cheklash
      if (pendingCount >= 10) break;
    }
  }

  // Yangilash tugmasini qo'shish
  keyboardButtons.push([{ text: "🔄 Yangilash", callback_data: `refresh_admin` }]);

  let panelText = `💼 **Admin Paneli**\n\n`;
  if (pendingCount > 0) {
    panelText += `✅ Tasdiqlashni kutayotgan obunalar soni: **${pendingCount}**.\nKo'rish uchun tugmani bosing.`;
  } else {
    panelText += `🎉 Hozirda tasdiqlashni kutayotgan obuna yo'q.`;
  }

  const keyboard = { inline_keyboard: keyboardButtons };
  
  if (messageId) {
      // Mavjud xabarni tahrirlash (yangilash)
      editMessageText(adminId, messageId, panelText, keyboard);
  } else {
      // Yangi xabar yuborish
      sendMessage(adminId, panelText, keyboard);
  }
}

/**
 * Webhookni o'rnatish
 * IZOH: Google Apps Script Web App URL'sini Telegram'ga Webhook sifatida o'rnatadi.
 */
function setWebhook() {
  const webAppUrl = ScriptApp.getService().getUrl();
  const setUrl = BOT_URL + "/setWebhook?url=" + webAppUrl;
  const response = UrlFetchApp.fetch(setUrl);
  Logger.log(response.getContentText());
}
