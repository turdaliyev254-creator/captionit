// Public legal & support pages (App Store needs Privacy Policy and Support URLs).
// Each page has Uzbek and English versions.

const UPDATED = '2026-yil 28-sentabr / September 28, 2026';
const CONTACT = {
  phone: '+998 99 913 97 57',
  phoneHref: 'tel:+998999139757',
  telegram: 't.me/izzatillokuu',
  instagram: 'instagram.com/izzatillo.man',
};

const contactHtml = `
  <ul class="contacts">
    <li>📞 <a href="${CONTACT.phoneHref}">${CONTACT.phone}</a></li>
    <li>✈️ Telegram: <a href="https://${CONTACT.telegram}">${CONTACT.telegram}</a></li>
    <li>📸 Instagram: <a href="https://${CONTACT.instagram}">${CONTACT.instagram}</a></li>
  </ul>`;

function page(title, body) {
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Captionit</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0b0f; color: #ececf1; }
  header { padding: 40px 20px 28px; background: linear-gradient(135deg, #8b5cff33, #ff3d9a33 55%, #ff8a3d22); border-bottom: 1px solid #ffffff1a; }
  header .wrap, main { max-width: 760px; margin: 0 auto; }
  h1 { margin: 0 0 6px; font-size: 30px; }
  .updated { color: #ffffff99; font-size: 14px; }
  nav a { display: inline-block; margin: 14px 10px 0 0; padding: 6px 14px; border-radius: 999px; background: #ffffff14; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
  main { padding: 8px 20px 60px; }
  h2 { margin-top: 36px; font-size: 22px; } h3 { margin-top: 26px; font-size: 17px; }
  a { color: #ff7ab8; } li { margin: 6px 0; }
  .lang { margin-top: 48px; padding-top: 8px; border-top: 1px solid #ffffff1a; }
  .contacts { list-style: none; padding: 0; }
</style></head>
<body><header><div class="wrap"><h1>${title}</h1><div class="updated">${UPDATED}</div>
<nav><a href="#uz">O‘zbekcha</a><a href="#en">English</a><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/support">Support</a></nav></div></header>
<main>${body}</main></body></html>`;
}

const privacy = page('Maxfiylik siyosati / Privacy Policy', `
<section id="uz">
<h2>Maxfiylik siyosati</h2>
<p>Ushbu siyosat Captionit mobil ilovasi va unga tegishli serverlar (keyingi o‘rinlarda — «Xizmat», «biz») qanday ma’lumotlarni yig‘ishi, ulardan qanday foydalanishi va saqlashini tushuntiradi. Ilovadan foydalanib, siz ushbu siyosatga rozilik bildirasiz.</p>

<h3>1. Qanday ma’lumotlarni yig‘amiz</h3>
<ul>
<li><b>Akkaunt ma’lumotlari:</b> telefon raqamingiz (SMS orqali kirishda), yoki Google / Apple akkauntingiz identifikatori, elektron pochtangiz va ismingiz (ushbu xizmatlar bizga taqdim etgan hajmda). Apple orqali kirishda pochtani yashirishingiz mumkin.</li>
<li><b>Siz yuklagan kontent:</b> videolar, ulardan ajratilgan audio, avtomatik matn (transkripsiya), siz qo‘shgan rasm va videolar, tahrirlash sozlamalari va tayyor videolar.</li>
<li><b>Texnik ma’lumotlar:</b> xizmat ishlashi va xavfsizligi uchun zarur bo‘lgan server loglari (IP manzil, so‘rov vaqti, xatoliklar).</li>
</ul>
<p>Biz reklama maqsadida kuzatuv qilmaymiz, reklama identifikatorlaridan foydalanmaymiz va ma’lumotlaringizni sotmaymiz.</p>

<h3>2. Ma’lumotlardan foydalanish maqsadi</h3>
<ul>
<li>Nutqni matnga aylantirish, subtitrli videoni tayyorlash va uni profilingizda saqlash;</li>
<li>akkauntingizni yaratish va himoya qilish, tizimga kirishni tasdiqlash;</li>
<li>so‘rovlaringizga javob berish va xizmat sifatini yaxshilash (xatoliklarni tuzatish).</li>
</ul>

<h3>3. Sun’iy intellekt va uchinchi tomon xizmatlari</h3>
<p>Nutqni matnga aylantirish uchun videongizning <b>faqat audio qismi</b> uchinchi tomon sun’iy intellekt xizmatiga yuboriladi. Bu ilovada birinchi marta video yuklashdan oldin sizdan alohida rozilik so‘raladi va siz rozilik bermasangiz, audio yuborilmaydi.</p>
<ul>
<li><b>ElevenLabs, Inc.</b> (AQSh) — nutqni matnga aylantirish (asosiy);</li>
<li><b>OpenAI, L.L.C.</b> (AQSh) — nutqni matnga aylantirish (zaxira, faqat ayrim tillar uchun);</li>
<li><b>Railway Corporation</b> — serverlar va ma’lumotlarni saqlash (hosting);</li>
<li><b>Eskiz.uz</b> (O‘zbekiston) — SMS tasdiqlash kodini yetkazish;</li>
<li><b>Google LLC, Apple Inc.</b> — siz tanlagan holda tizimga kirish.</li>
</ul>
<p>Ushbu xizmatlar ma’lumotlarni faqat bizga xizmat ko‘rsatish uchun va o‘z maxfiylik siyosatlariga muvofiq qayta ishlaydi. Ma’lumotlaringiz O‘zbekistondan tashqaridagi serverlarda qayta ishlanishi mumkin.</p>

<h3>4. Saqlash muddati va o‘chirish</h3>
<ul>
<li>Videolaringiz siz ularni o‘chirmaguningizcha profilingizda saqlanadi. Profildan istalgan videoni o‘chirishingiz mumkin — u serverlarimizdan darhol o‘chiriladi.</li>
<li>Ilovadagi <b>Profil → Sozlamalar → Akkauntni o‘chirish</b> orqali akkauntingizni va unga tegishli barcha videolar, audio va matnlarni butunlay o‘chirishingiz mumkin.</li>
<li>Texnik loglar 30 kungacha saqlanadi.</li>
</ul>

<h3>5. Sizning huquqlaringiz</h3>
<p>Siz o‘z ma’lumotlaringizni ko‘rish, tuzatish, o‘chirish va sun’iy intellekt xizmatiga audio yuborish roziligini qaytarib olish huquqiga egasiz. Buning uchun ilovadagi sozlamalardan foydalaning yoki biz bilan bog‘laning.</p>

<h3>6. Bolalar</h3>
<p>Xizmat 13 yoshga to‘lmagan bolalar uchun mo‘ljallanmagan va biz ulardan ongli ravishda ma’lumot yig‘maymiz.</p>

<h3>7. Xavfsizlik</h3>
<p>Ma’lumotlar HTTPS orqali shifrlangan holda uzatiladi, akkauntga kirish tokenlar bilan himoyalangan. Hech bir tizim 100% xavfsiz emasligini inobatga oling.</p>

<h3>8. O‘zgarishlar</h3>
<p>Siyosat o‘zgarsa, yangi versiya shu sahifada e’lon qilinadi va muhim o‘zgarishlar haqida ilovada xabar beramiz.</p>

<h3>9. Bog‘lanish</h3>
${contactHtml}
</section>

<section id="en" class="lang">
<h2>Privacy Policy</h2>
<p>This policy explains what information the Captionit mobile app and its servers (the “Service”, “we”) collect, how we use it and how long we keep it. By using the app you agree to this policy.</p>

<h3>1. Information we collect</h3>
<ul>
<li><b>Account data:</b> your phone number (SMS sign-in), or your Google / Apple account identifier, email address and name as provided by those services. With Sign in with Apple you may hide your email.</li>
<li><b>Content you provide:</b> videos, the audio extracted from them, automatic transcripts, images and clips you add, editing settings and the finished videos.</li>
<li><b>Technical data:</b> server logs needed to run and secure the Service (IP address, request time, errors).</li>
</ul>
<p>We do not track you for advertising, do not use advertising identifiers and do not sell your data.</p>

<h3>2. How we use it</h3>
<ul>
<li>To transcribe speech, produce captioned videos and keep them in your profile;</li>
<li>to create and secure your account and verify sign-in;</li>
<li>to answer your requests and fix problems.</li>
</ul>

<h3>3. Artificial intelligence and third-party services</h3>
<p>To transcribe speech, <b>only the audio track</b> of your video is sent to a third-party AI service. The app asks for your explicit permission before your first upload; without it no audio is sent.</p>
<ul>
<li><b>ElevenLabs, Inc.</b> (USA) — speech-to-text (primary);</li>
<li><b>OpenAI, L.L.C.</b> (USA) — speech-to-text (fallback for some languages);</li>
<li><b>Railway Corporation</b> — servers and storage (hosting);</li>
<li><b>Eskiz.uz</b> (Uzbekistan) — delivery of SMS verification codes;</li>
<li><b>Google LLC, Apple Inc.</b> — sign-in, if you choose it.</li>
</ul>
<p>These providers process data only to provide their service to us and under their own privacy policies. Your data may be processed on servers outside Uzbekistan.</p>

<h3>4. Retention and deletion</h3>
<ul>
<li>Your videos stay in your profile until you delete them; a deleted video is removed from our servers immediately.</li>
<li>You can delete your account together with all videos, audio and transcripts in the app: <b>Profile → Settings → Delete account</b>.</li>
<li>Technical logs are kept for up to 30 days.</li>
</ul>

<h3>5. Your rights</h3>
<p>You may access, correct and delete your data and withdraw your consent to sending audio to the AI service at any time, in the app settings or by contacting us.</p>

<h3>6. Children</h3>
<p>The Service is not intended for children under 13 and we do not knowingly collect their data.</p>

<h3>7. Security</h3>
<p>Data is transmitted encrypted over HTTPS and account access is protected by tokens. No system is 100% secure.</p>

<h3>8. Changes</h3>
<p>We will publish any new version on this page and notify you in the app about material changes.</p>

<h3>9. Contact</h3>
${contactHtml}
</section>`);

const terms = page('Foydalanish shartlari / Terms of Use', `
<section id="uz">
<h2>Foydalanish shartlari</h2>
<p>Captionit ilovasini yuklab olish yoki undan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz. Rozi bo‘lmasangiz, ilovadan foydalanmang.</p>

<h3>1. Xizmat</h3>
<p>Captionit videolardagi nutqni avtomatik matnga aylantiradi, subtitr qo‘shadi, tahrirlash (stil, qirqish, rasm/video qo‘shish) va tayyor videoni saqlash imkonini beradi. Xizmat hozircha bepul; kelajakda pullik imkoniyatlar qo‘shilsa, ular oldindan aniq ko‘rsatiladi va App Store orqali to‘lanadi.</p>

<h3>2. Akkaunt</h3>
<p>Foydalanish uchun kamida 13 yoshda bo‘lishingiz kerak. Akkauntingiz xavfsizligi va undan qilingan harakatlar uchun o‘zingiz javobgarsiz. Akkauntingizni istalgan vaqtda ilova ichida o‘chirishingiz mumkin.</p>

<h3>3. Sizning kontentingiz</h3>
<p>Siz yuklagan videolar va ularga bo‘lgan barcha huquqlar sizda qoladi. Xizmatni ko‘rsatishimiz uchun (saqlash, nutqni matnga aylantirish, video tayyorlash) bizga kontentingizni faqat shu maqsadda qayta ishlash uchun cheklangan, bepul litsenziya berasiz. Kontentni o‘chirganingizda litsenziya tugaydi.</p>
<p>Siz yuklagan video, musiqa, rasm va boshqa materiallarga tegishli huquqlarga ega ekanligingizga kafolat berasiz.</p>

<h3>4. Taqiqlangan foydalanish</h3>
<ul>
<li>O‘zbekiston Respublikasi yoki boshqa amaldagi qonunlarni buzuvchi kontent;</li>
<li>boshqalarning mualliflik huquqi, shaxsiy hayoti yoki boshqa huquqlarini buzish;</li>
<li>zo‘ravonlik, nafrat, terrorizmni targ‘ib qiluvchi, voyaga yetmaganlarga oid jinsiy yoki boshqa zararli kontent;</li>
<li>xizmatni buzishga, uning xavfsizligini chetlab o‘tishga yoki ortiqcha yuklashga urinish.</li>
</ul>
<p>Ushbu qoidalar buzilganda kontentni o‘chirish yoki akkauntni bloklash huquqini o‘zimizda saqlab qolamiz.</p>

<h3>5. Sun’iy intellekt natijalari</h3>
<p>Avtomatik matn va subtitrlar sun’iy intellekt yordamida yaratiladi va xatolar bo‘lishi mumkin. Tayyor videoni e’lon qilishdan oldin matnni tekshirish va tuzatish sizning mas’uliyatingizda.</p>

<h3>6. Kafolatlar va javobgarlik</h3>
<p>Xizmat «boricha» taqdim etiladi. Qonun ruxsat bergan darajada biz xizmatning uzluksiz ishlashi yoki xatosizligi uchun kafolat bermaymiz va bilvosita zararlar, ma’lumot yoki foyda yo‘qotilishi uchun javobgar emasmiz. Muhim videolaringizning nusxasini o‘zingizda saqlang.</p>

<h3>7. Apple</h3>
<p>Ilova App Store orqali tarqatiladi va Apple’ning standart foydalanuvchi litsenziya shartnomasi (Standard EULA) ham qo‘llaniladi. Ushbu shartlar siz bilan biz o‘rtasida tuziladi, Apple emas; Apple ilova va uni qo‘llab-quvvatlash uchun javobgar emas.</p>

<h3>8. O‘zgarishlar va yakunlash</h3>
<p>Shartlarni yangilashimiz mumkin; yangi versiya shu sahifada e’lon qilinadi. Foydalanishni davom ettirish yangi shartlarga rozilik bildiradi. Siz istalgan vaqtda akkauntni o‘chirib, foydalanishni to‘xtatishingiz mumkin.</p>

<h3>9. Qo‘llaniladigan qonun</h3>
<p>Ushbu shartlar O‘zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi.</p>

<h3>10. Bog‘lanish</h3>
${contactHtml}
</section>

<section id="en" class="lang">
<h2>Terms of Use</h2>
<p>By downloading or using the Captionit app you agree to these terms. If you do not agree, do not use the app.</p>

<h3>1. The Service</h3>
<p>Captionit automatically transcribes speech in your videos, adds captions, lets you edit them (styles, trimming, adding images/clips) and save the finished video. The Service is currently free; if paid features are added they will be clearly shown in advance and billed through the App Store.</p>

<h3>2. Account</h3>
<p>You must be at least 13 years old. You are responsible for your account’s security and activity. You can delete your account in the app at any time.</p>

<h3>3. Your content</h3>
<p>You keep all rights to the videos you upload. To provide the Service (storage, transcription, rendering) you grant us a limited, royalty-free licence to process your content solely for that purpose; it ends when you delete the content.</p>
<p>You confirm that you hold the necessary rights to the videos, music, images and other material you upload.</p>

<h3>4. Prohibited use</h3>
<ul>
<li>Content that violates the laws of the Republic of Uzbekistan or other applicable law;</li>
<li>infringing others’ copyright, privacy or other rights;</li>
<li>content promoting violence, hatred or terrorism, sexual content involving minors, or other harmful content;</li>
<li>attempting to disrupt, overload or bypass the security of the Service.</li>
</ul>
<p>We may remove content or suspend accounts that break these rules.</p>

<h3>5. AI output</h3>
<p>Transcripts and captions are generated by artificial intelligence and may contain mistakes. You are responsible for reviewing and correcting the text before publishing a video.</p>

<h3>6. Warranties and liability</h3>
<p>The Service is provided “as is”. To the extent permitted by law we do not guarantee uninterrupted or error-free operation and are not liable for indirect damages or loss of data or profits. Keep your own copies of important videos.</p>

<h3>7. Apple</h3>
<p>The app is distributed through the App Store and Apple’s Standard End User License Agreement also applies. These terms are between you and us, not Apple; Apple is not responsible for the app or its support.</p>

<h3>8. Changes and termination</h3>
<p>We may update these terms; the new version will be published on this page. Continuing to use the app means you accept it. You may stop using the Service and delete your account at any time.</p>

<h3>9. Governing law</h3>
<p>These terms are governed by the laws of the Republic of Uzbekistan.</p>

<h3>10. Contact</h3>
${contactHtml}
</section>`);

const support = page('Yordam / Support', `
<section id="uz">
<h2>Biz bilan bog‘lanish</h2>
<p>Savol, taklif yoki muammo bo‘lsa, bizga yozing — imkon qadar tez javob beramiz.</p>
${contactHtml}
<h3>Ko‘p so‘raladigan savollar</h3>
<p><b>Akkauntni qanday o‘chiraman?</b><br>Ilovada: Profil → Sozlamalar → Akkauntni o‘chirish. Barcha videolaringiz ham o‘chiriladi.</p>
<p><b>Subtitrda xato bo‘lsa-chi?</b><br>Muharrirdagi «Matn» bo‘limida istalgan iborani tuzatishingiz mumkin.</p>
<p><b>Videom qayerda saqlanadi?</b><br>Profilingizda. Uni galereyaga saqlashingiz yoki ulashishingiz mumkin.</p>
</section>
<section id="en" class="lang">
<h2>Contact us</h2>
<p>Questions, ideas or problems? Write to us and we will reply as soon as possible.</p>
${contactHtml}
<h3>FAQ</h3>
<p><b>How do I delete my account?</b><br>In the app: Profile → Settings → Delete account. All your videos are deleted too.</p>
<p><b>The captions have a mistake?</b><br>Edit any phrase in the editor’s “Matn” (Text) tab.</p>
<p><b>Where are my videos?</b><br>In your profile; you can save them to your gallery or share them.</p>
</section>`);

function mountLegal(app) {
  app.get('/legal/privacy', (req, res) => res.type('html').send(privacy));
  app.get('/legal/terms', (req, res) => res.type('html').send(terms));
  app.get('/support', (req, res) => res.type('html').send(support));
}

module.exports = { mountLegal, CONTACT };
