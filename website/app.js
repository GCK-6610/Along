// Supabase Client for Public Landing Page
const SUPABASE_URL = 'https://bahmgqxuxuohaaubrvui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaG1ncXh1eHVvaGFhdWJydnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMzgzOTgsImV4cCI6MjEwMTYxNDM5OH0.uIlxlVJRxIlPFs8ucJO3ZeoFwX5IeBXcIbAahrQt8mA';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initFormHandler();
});

// Theme Management: Light by default, system-aware, user-toggleable
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  function updateIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
  }

  updateIcon();

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let nextTheme;

    if (currentTheme === 'dark') {
      nextTheme = 'light';
    } else if (currentTheme === 'light') {
      nextTheme = 'dark';
    } else {
      // If currently following system, toggle to opposite of current visual state
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      nextTheme = isSystemDark ? 'light' : 'dark';
    }

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('along_theme', nextTheme);
    updateIcon();
  });
}

// Venue Partner Application Form
function initFormHandler() {
  const form = document.getElementById('venuePartnerForm');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting Application...';

    const formData = new FormData(form);
    const payload = {
      venue_name: formData.get('venue_name'),
      category: formData.get('category'),
      city_area: formData.get('city_area'),
      contact_name: formData.get('contact_name'),
      contact_phone: formData.get('contact_phone'),
      proposed_perk: formData.get('proposed_perk') || null,
      status: 'pending'
    };

    try {
      const { data, error } = await supabaseClient
        .from('venue_partner_applications')
        .insert([payload]);

      if (error) throw error;

      feedback.style.display = 'block';
      feedback.style.background = 'rgba(16, 185, 129, 0.12)';
      feedback.style.color = '#059669';
      feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      feedback.innerHTML = `<strong>🎉 Application Received!</strong><br>Thank you! Our Hyderabad team will contact you at ${payload.contact_phone} to verify and list your spot on Along.`;

      form.reset();
      submitBtn.style.display = 'none';
    } catch (err) {
      console.error('Submission error:', err);
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(255, 71, 87, 0.12)';
      feedback.style.color = '#FF4757';
      feedback.style.border = '1px solid rgba(255, 71, 87, 0.3)';
      feedback.innerHTML = `<strong>Submission issue:</strong> ${err.message || 'Please try again or contact support.'}`;
      submitBtn.disabled = false;
      submitBtn.innerText = 'Apply for Venue Tie-Up 🚀';
    }
  });
}
