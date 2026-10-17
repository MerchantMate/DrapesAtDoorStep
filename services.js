(() => {
  const apiBase = (window.DRAPES_CONFIG?.apiBaseUrl || '').replace(/\/$/, '');
  const form = document.querySelector('#enquiry-form');
  const fields = document.querySelector('#enquiry-fields');
  const submit = document.querySelector('#enquiry-submit');
  const status = document.querySelector('#enquiry-status');
  const dateInput = document.querySelector('#visit-date');
  const dialog = document.querySelector('#chat-dialog');
  const launcher = document.querySelector('#chat-launcher');
  const chatForm = document.querySelector('#chat-form');
  const chatFields = document.querySelector('#chat-fields');
  const chatInput = document.querySelector('#chat-input');
  const chatStatus = document.querySelector('#chat-status');
  const chatLog = document.querySelector('#chat-log');
  let emailEnabled = false;
  let chatEnabled = false;
  let sending = false;
  let chatting = false;
  let lastEnquiry = '';
  let requestId = '';
  let history = [];

  const notify = (element, message, error = false) => {
    element.textContent = message;
    element.classList.toggle('is-error', error);
  };

  async function api(path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), body ? 45000 : 8000);
    try {
      const response = await fetch(`${apiBase}/api/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'This service is unavailable. Please contact the merchant on Instagram.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) {
        throw new Error('We couldn’t confirm the request completed. Check your connection, then try again or contact the merchant on Instagram.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  // The HTML fieldsets start disabled, so a script failure cannot submit personal
  // details through a GET URL. No form or chat content is saved in browser storage.
  async function checkServices() {
    try {
      const config = await api('config');
      emailEnabled = config.email_enabled === true;
      chatEnabled = config.chat_enabled === true;
      if (/^\d{4}-\d{2}-\d{2}$/.test(config.today)) dateInput.min = config.today;
    } catch {
      emailEnabled = false;
      chatEnabled = false;
    }
    fields.disabled = !emailEnabled;
    chatFields.disabled = !chatEnabled;
    notify(status, emailEnabled ? 'Ready to send your enquiry to the merchant.' : 'Online enquiries aren’t available yet. Please contact @soupujithas on Instagram.');
    notify(chatStatus, chatEnabled ? 'AI assistant ready. Your messages are sent to OpenAI.' : 'AI chat is unavailable. Quick answers above still work, or contact the merchant.');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !emailEnabled || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    values.consent = values.consent === 'on';
    for (const key of Object.keys(values)) {
      if (typeof values[key] === 'string') values[key] = values[key].trim();
    }
    const fingerprint = JSON.stringify(values);
    if (lastEnquiry !== fingerprint) {
      requestId = crypto.randomUUID();
      lastEnquiry = fingerprint;
    }
    sending = true;
    fields.disabled = true;
    submit.textContent = 'Sending enquiry…';
    form.setAttribute('aria-busy', 'true');
    notify(status, 'Sending your details to the merchant…');
    try {
      const result = await api('enquiries', { ...values, request_id: requestId });
      if (!result.reference || !result.message) throw new Error('We couldn’t confirm delivery. Please contact the merchant on Instagram.');
      notify(status, `${result.message} Reference: ${result.reference}`);
      form.reset();
      lastEnquiry = '';
      requestId = '';
    } catch (error) {
      notify(status, error.message, true);
    } finally {
      sending = false;
      fields.disabled = !emailEnabled;
      submit.textContent = 'Send visit enquiry ↗';
      form.removeAttribute('aria-busy');
    }
  });

  launcher.hidden = false;
  launcher.addEventListener('click', () => {
    dialog.showModal();
    launcher.setAttribute('aria-expanded', 'true');
    if (chatEnabled) chatInput.focus();
  });
  document.querySelector('#chat-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  });

  function addMessage(label, text, fromUser = false) {
    const bubble = document.createElement('p');
    bubble.className = `chat-message${fromUser ? ' from-user' : ''}`;
    const author = document.createElement('strong');
    author.textContent = label;
    const content = document.createElement('span');
    content.textContent = text;
    bubble.append(author, content);
    chatLog.append(bubble);
    while (chatLog.children.length > 30) chatLog.firstElementChild.remove();
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  const faqAnswers = {
    visits: 'The merchant brings sarees to your home so you can see the colours and feel the fabrics. Send an enquiry with your preferred date and time; the merchant will confirm the visit directly.',
    area: 'Please check your area and any visit charges with the merchant. Coverage details haven’t been confirmed here yet. Use the enquiry form or message @soupujithas on Instagram.',
    stock: 'The collection shown here is a sample. For current sarees, prices, and availability, contact @soupujithas on Instagram. You can mention a favourite post in your visit enquiry.',
  };
  document.querySelectorAll('[data-faq]').forEach((button) => {
    button.addEventListener('click', () => {
      if (chatting) return;
      addMessage('You', button.textContent, true);
      addMessage('Quick answer', faqAnswers[button.dataset.faq]);
    });
  });

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!chatEnabled || chatting || !message || !chatForm.reportValidity()) return;
    chatting = true;
    chatFields.disabled = true;
    addMessage('You', message, true);
    notify(chatStatus, 'AI assistant is replying…');
    try {
      const result = await api('chat', { message, history: history.slice(-8) });
      if (typeof result.reply !== 'string' || !result.reply.trim()) throw new Error('No reply was received. Please try again.');
      addMessage('AI assistant', result.reply);
      history.push({ role: 'user', content: message }, { role: 'assistant', content: result.reply });
      history = history.slice(-8);
      chatInput.value = '';
      notify(chatStatus, 'For a confirmed answer about availability or bookings, contact the merchant.');
    } catch (error) {
      notify(chatStatus, error.message, true);
    } finally {
      chatting = false;
      chatFields.disabled = !chatEnabled;
      if (dialog.open) chatInput.focus();
    }
  });

  checkServices();
})();
