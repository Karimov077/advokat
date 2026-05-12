require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID);

console.log('Bot ishga tushmoqda...');

const bot = new TelegramBot(token, { polling: true });

// Bot ma'lumotlarini olish (promise then bilan)
bot.getMe().then((botInfo) => {
    console.log(`✅ Bot ishga tushdi: @${botInfo.username}`);
}).catch((err) => {
    console.log('❌ Bot ulanish xatosi:', err.message);
});

// /start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
`👨‍⚖️ ADVOKAT BOTIGA XUSH KELIBSIZ!

📝 Buyruqlar:
/ariza - Ariza qoldirish
/about - Biz haqimizda
/contact - Kontakt

🔐 Admin: /admin`
    );
});

// Ariza qoldirish uchun session
const userSessions = {};

bot.onText(/\/ariza/, (msg) => {
    const chatId = msg.chat.id;
    userSessions[chatId] = { step: 1 };
    bot.sendMessage(chatId, "✍️ Ismingizni kiriting:");
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/')) return;
    
    if (userSessions[chatId]) {
        const session = userSessions[chatId];
        
        if (session.step === 1) {
            session.name = text;
            session.step = 2;
            bot.sendMessage(chatId, "📞 Telefon raqamingiz (masalan: +998901234567):");
        }
        else if (session.step === 2) {
            session.phone = text;
            session.step = 3;
            bot.sendMessage(chatId, "⚖️ Ish turi (Oilaviy, Jinoyat, Fuqarolik, Mehnat):");
        }
        else if (session.step === 3) {
            session.caseType = text;
            session.step = 4;
            bot.sendMessage(chatId, "📝 Muammoingizni qisqacha yozing:");
        }
        else if (session.step === 4) {
            session.message = text;
            
            bot.sendMessage(chatId, 
`✅ ARIZANGIZ QABUL QILINDI!
━━━━━━━━━━━━━━━━
👤 ${session.name}
📞 ${session.phone}
⚖️ ${session.caseType}
━━━━━━━━━━━━━━━━

Tez orada advokat siz bilan bog'lanadi.
@Negotiate_05`);
            
            if (ADMIN_ID) {
                bot.sendMessage(ADMIN_ID, 
`🆕 YANGI ARIZA!
━━━━━━━━━━━━━━━━
👤 Ism: ${session.name}
📞 Telefon: ${session.phone}
⚖️ Ish turi: ${session.caseType}
📝 Matn: ${session.message}
━━━━━━━━━━━━━━━━
📅 Vaqt: ${new Date().toLocaleString('uz-UZ')}`
                ).catch(err => console.log('Admin xabar yuborilmadi'));
            }
            
            delete userSessions[chatId];
        }
    }
});

// Admin paneli
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    
    if (chatId !== ADMIN_ID) {
        return bot.sendMessage(chatId, "❌ Bu buyruq faqat admin uchun!");
    }
    
    bot.sendMessage(chatId, 
`👨‍⚖️ ADMIN PANELI
━━━━━━━━━━━━━━━━
🔹 /list - Mijozlar ro'yxati
🔹 /stats - Statistika
━━━━━━━━━━━━━━━━

💻 Web admin: http://localhost:3000
👤 KARIMOV / 1234`
    );
});

// Mijozlar ro'yxati
bot.onText(/\/list/, (msg) => {
    if (msg.chat.id !== ADMIN_ID) return;
    
    try {
        const db = require('./database');
        db.getClients((err, clients) => {
            if (err || !clients || clients.length === 0) {
                return bot.sendMessage(msg.chat.id, "📭 Mijozlar ro'yxati bo'sh");
            }
            
            let text = "📋 MIJOZLAR RO'YXATI:\n━━━━━━━━━━━━━━━━\n";
            clients.slice(0, 15).forEach((c, i) => {
                text += `${i+1}. ${c.fullname || c.name}\n   📞 ${c.phone}\n\n`;
            });
            bot.sendMessage(msg.chat.id, text);
        });
    } catch(e) {
        bot.sendMessage(msg.chat.id, "📭 Hozircha mijozlar yo'q");
    }
});

// Statistika
bot.onText(/\/stats/, (msg) => {
    if (msg.chat.id !== ADMIN_ID) return;
    
    try {
        const db = require('./database');
        db.getClients((err, clients) => {
            const count = clients ? clients.length : 0;
            bot.sendMessage(msg.chat.id, 
`📊 STATISTIKA
━━━━━━━━━━━━━━━━
👥 Mijozlar soni: ${count}
📅 Bugun: ${new Date().toLocaleDateString('uz-UZ')}
━━━━━━━━━━━━━━━━
📈 Batafsil web panelda`);
        });
    } catch(e) {
        bot.sendMessage(msg.chat.id, "📊 Statistika yuklanmadi");
    }
});

// Biz haqimizda
bot.onText(/\/about/, (msg) => {
    bot.sendMessage(msg.chat.id, 
`⚖️ NIGORA LAW FIRM
━━━━━━━━━━━━━━━━
📅 10+ yillik tajriba
👨‍⚖️ Malakali advokatlar

🏛 Xizmatlar:
• Fuqarolik ishlari
• Jinoyat ishlari
• Oilaviy nizolar
• Mehnat nizolari

📍 Toshkent sh., Navoiy 15`
    );
});

// Kontakt
bot.onText(/\/contact/, (msg) => {
    bot.sendMessage(msg.chat.id, 
`📞 KONTAKT
━━━━━━━━━━━━━━━━
☎️ Telefon: +998 90 123 45 67
📧 Email: info@nigoralaw.uz
📱 Telegram: @Negotiate_05

⏰ 09:00 - 18:00 (Dush-Juma)`
    );
});

// Xatoliklarni ushlash
bot.on('polling_error', (error) => {
    console.log('Polling error:', error.message);
});

console.log('Bot ishga tushmoqda...');