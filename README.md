# 🤖 Telegram Obuna Bot (Google Apps Script + Sheets DB)

Bu loyiha **Google Apps Script** yordamida yaratilgan bo'lib, Telegram orqali yopiq guruhga obuna bo'lish jarayonini **chek orqali tasdiqlash** asosida avtomatlashtirishga mo'ljallangan. Ma'lumotlar bazasi sifatida oddiy va samarali **Google Sheets** (jadvali) ishlatiladi.

## ✨ Xususiyatlari

* **Google Apps Script (GAS) orqali hosting:** Server talab qilinmaydi.
* **Google Sheets (DB):** Foydalanuvchilar ma'lumotlari, chek file ID'lari va statuslar Sheets'da saqlanadi.
* **Admin Paneli:** Maxsus `/admin` buyrug'i orqali kutishdagi obunalarni ko'rish, chekni ko'rish, **Tasdiqlash** yoki **Rad etish** funksiyalari.
* **Xavfsiz Guruhga Kirish:** Tasdiqlashdan so'ng, foydalanuvchiga faqat **bir marta ishlatiladigan** noyob havola yaratiladi (`createChatInviteLink`), bu havolaning tarqalib ketishini oldini oladi.
* **Interfeysni Tozalash:** Har bir yangi buyruq yoki xabar yuborilganda, bot avvalgi xabarini o'chiradi, bu esa chatni tartibli saqlashga yordam beradi.

## 🛠️ O'rnatish (Qadamlar)

1.  **Google Sheets yaratish:** Google Drive'da yangi Sheets faylini yarating va uning **URL'idan ID raqamini** oling.

2.  **Google Apps Script loyihasini yaratish:**
    * Google Drive'da: **Yangi** -> **Ko'proq** -> **Google Apps Script**.
    * `Code.gs` fayliga yuqoridagi kodni (o'zbek tilidagi izohlari bilan) joylang.

3.  **Sozlamalarni kiritish:** `Code.gs` faylining boshidagi `/* SOZLAMALAR */` bo'limiga o'ting va o'zingizning ma'lumotlaringizni kiriting:

    ```javascript
    const TOKEN = "YOUR_BOT_TOKEN_HERE"; // @BotFather dan olingan token
    const ADMIN_CHAT_ID = "YOUR_ADMIN_CHAT_ID"; // O'zingizning ID'ingiz
    const TARGET_GROUP_ID = "YOUR_TARGET_GROUP_ID"; // Guruh ID'si (manfiy son)
    const SS_ID = "YOUR_SPREADSHEET_ID"; // Sheets fayli ID'si
    // ... boshqa sozlamalar (narx, karta)
    ```

4.  **Botni Guruhga Qo'shish:**
    * Botni obuna qilinadigan **yopiq guruhga** admin qilib qo'shing.
    * Botga **"Taklif havolalarini boshqarish"** huquqini bering, chunki u bir martalik havolalarni yaratishi kerak.

5.  **Webhook o'rnatish:**
    * Script tahrirlovchisida yuqoridagi paneldan **`setWebhook`** funksiyasini tanlang va **Run (Ishga tushirish)** tugmasini bosing.
    * Ishga tushirish uchun **ruxsat so'rovi** chiqadi, uni qabul qiling.

6.  **Web App'ni joylash (Deploy):**
    * Tahrirlovchining o'ng yuqori qismidagi **Deploy (Joylash)** tugmasini bosing.
    * **New deployment (Yangi joylash)** ni tanlang.
    * **Type (Turini)** `Web app` deb o'rnating.
    * **Execute as (Kim sifatida ishga tushirish):** `Me (O'zim)`
    * **Who has access (Kim foydalana oladi):** `Anyone (Har kim)`
    * Joylang. Hosil bo'lgan URL'ni Webhookga o'rnatish uchun yana **`setWebhook`** ni bosing.

## ⚙️ Ishlash Mantiqi

| Buyruq/Harakat | Kim | Vazifasi |
| :--- | :--- | :--- |
| `/start` yoki `/obuna` | Foydalanuvchi | To'lov ma'lumotlarini (Karta raqami, Narx) ko'rsatadi va DB'ga "Yangi" statusini qo'shadi. |
| **Rasm yuborish** | Foydalanuvchi | Chekni botga yuboradi. DB'ga chek `file_id`si va "Kutishda" statusi yoziladi. |
| `/admin` | Admin | Tasdiqlashni kutayotgan obunalarni inline tugmalar ro'yxati shaklida ko'rsatadi. |
| `view_[ID]` tugmasi | Admin | Tanlangan foydalanuvchining chekini rasm sifatida qabul qilish va "Qabul qilish / Rad etish" tugmalarini ko'rsatadi. |
| `approve_[ID]` tugmasi | Admin | Foydalanuvchi statusini "Tasdiqlandi"ga o'zgartiradi. Foydalanuvchiga **bir martalik** guruhga kirish havolasi yuboriladi (Maxsus `/start` havolasi orqali). |
| `/start INVITE_[ID]` | Foydalanuvchi | Tasdiqlangan foydalanuvchi bu havolaga kirsa, bot **yangi** bir martalik guruh havolasini yaratadi va DB'da **link_used** ni `TRUE` qiladi. |
| `reject_[ID]` tugmasi | Admin | Foydalanuvchi statusini "Rad etildi"ga o'zgartiradi va unga xabar yuboradi. |

---
**Qo'shimcha Eslatma:**
Agar siz o'qituvchi/talaba bo'lsangiz, bu botni o'quv guruhlaringizga kirishni boshqarish uchun ishlatishingiz mumkin. Dizaynga qiziqishingizni inobatga olib, bot xabarlarida ishlatilgan **emojilar** va **Markdown/HTML** formatlash (masalan, `<b>`, `<code>`, `**`) xabarlarni vizual jihatdan yanada jozibali qiladi.
