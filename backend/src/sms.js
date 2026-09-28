// SMS delivery through Eskiz.uz (Uzbek SMS gateway). Returns true when the SMS was sent.
// Without ESKIZ_EMAIL / ESKIZ_PASSWORD it only logs the message (development).
let eskizToken = null;

async function eskizLogin() {
  const form = new FormData();
  form.append('email', process.env.ESKIZ_EMAIL);
  form.append('password', process.env.ESKIZ_PASSWORD);
  const res = await fetch('https://notify.eskiz.uz/api/auth/login', { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.data?.token) throw new Error(`Eskiz login failed (${res.status})`);
  eskizToken = body.data.token;
}

async function eskizSend(phone, message, retry = true) {
  if (!eskizToken) await eskizLogin();
  const form = new FormData();
  form.append('mobile_phone', phone.replace('+', ''));
  form.append('message', message);
  form.append('from', process.env.ESKIZ_FROM || '4546');
  const res = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${eskizToken}` },
    body: form,
  });
  if (res.status === 401 && retry) {
    eskizToken = null;
    return eskizSend(phone, message, false);
  }
  if (!res.ok) throw new Error(`Eskiz send failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

async function sendSms(phone, message) {
  if (process.env.ESKIZ_EMAIL && process.env.ESKIZ_PASSWORD) {
    await eskizSend(phone, message);
    return true;
  }
  console.log(`[sms:dev] ${phone}: ${message}`);
  return false;
}

module.exports = { sendSms };
