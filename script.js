let selectedPriority = 'low';

function setPriority(btn) {
  document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedPriority = btn.dataset.p;
}

async function submitTicket(button) {
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const department = document.getElementById('f-dept').value;
  const category = document.getElementById('f-cat').value;
  const subject = document.getElementById('f-subject').value.trim();
  const description = document.getElementById('f-desc').value.trim();
  const err = document.getElementById('form-error');

  if (!name || !email || !category || !subject || !description) {
    err.textContent = 'Please fill in all required fields.';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';

  // Show loading state
  const submitBtn = button || document.querySelector('.submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        department: department || null,
        category,
        priority: selectedPriority,
        subject,
        description
      })
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const message = result?.error || result?.message || 'Failed to submit ticket';
      throw new Error(message);
    }

    document.getElementById('ticket-id').textContent = '#' + result.ticketId;
    document.getElementById('ticket-form').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    err.textContent = error.message || 'Failed to submit ticket. Please try again.';
    err.style.display = 'block';
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

function resetForm() {
  document.getElementById('ticket-form').style.display = 'block';
  document.getElementById('form-success').style.display = 'none';
  document.getElementById('f-name').value = '';
  document.getElementById('f-email').value = '';
  document.getElementById('f-dept').value = '';
  document.getElementById('f-cat').value = '';
  document.getElementById('f-subject').value = '';
  document.getElementById('f-desc').value = '';
  selectedPriority = 'low';
  document.querySelectorAll('.priority-btn').forEach(b => b.classList.toggle('active', b.dataset.p === 'low'));
  const err = document.getElementById('form-error');
  err.style.display = 'none';
  err.textContent = 'Please fill in all required fields.';
}

function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});