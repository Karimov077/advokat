const app = require('./server');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║   👨‍⚖️ ADVOKAT CRM - ISHGA TUSHDI      ║
    ╠══════════════════════════════════════╣
    ║   Web:    http://localhost:${port}     ║
    ║   Login:  KARIMOV / 1234             ║
    ╠══════════════════════════════════════╣
    ║   Bot:    Telegramda ishga tushgan   ║
    ╚══════════════════════════════════════╝
    `);
});