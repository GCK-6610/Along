// ==========================================================================
// Along — Interactive 5-Minute Pitch Deck Logic
// Grounded Indian & Hyderabad Context, INR Economics, Speaker Scripts & Timer
// ==========================================================================

const SLIDES_COUNT = 7;
let currentSlideIndex = 0;

// Exact 40-to-45-second scripts for each slide (Story-driven with Ananya & Rahul in Hyderabad)
const SPEAKER_SCRIPTS = [
  // Slide 1: Title
  `"Good morning judges and mentors. I'm excited to present <mark>Along</mark>—the hyperlocal tag-along social network, engineered right here in Hyderabad. While legacy social apps try to trap users behind glass, Along does the opposite: turning crowds of city strangers into spontaneous real-world hangouts in under 60 seconds. Our production-ready MVP is fully built, and we're here today to present our go-to-market rollout for Hyderabad's tech corridor."`,

  // Slide 2: Problem (Meet Ananya & Rahul)
  `"To understand why modern social discovery is broken, meet Ananya and Rahul. <mark>Ananya is 24, a Product Designer at Microsoft</mark> who relocated from Delhi to Madhapur. <mark>Rahul is 25, a backend engineer at Swiggy</mark> in Gachibowli. Over 65% of tech workers in Hyderabad relocate like them. They earn ₹18 to ₹22 LPA, live in modern high-rises or PGs, but have zero social circle outside of work. Dating apps feel like awkward job interviews with 85% ghosting and safety fears. WhatsApp groups spend 4 days debating 'Kab milein?' until plans fall through. They are surrounded by thousands of peers, yet stuck alone on Friday night."`,

  // Slide 3: Solution (4-Step Tag-Along Flow)
  `"Along solves this through the Tag-Along philosophy in 4 seamless steps: First, Rahul types one spontaneous sentence—<mark>'Badminton this Saturday 7am at Smash Arena for 4 people'</mark>—and our AI parses it in one second. Second, our Safety & Gender Filter: hosts can set plans to <mark>'Everyone Welcome' or 'Women Only'</mark>—giving Ananya total peace of mind for her weekend hangouts. Third, Ananya opens our <mark>PostGIS Map View</mark>, spots Rahul's badminton pin 1.1 km away in Gachibowli, and joins with 1 click. Fourth, they meet at the court, check in via GPS to unlock 20% off the turf fee, and leave mutual trust ratings."`,

  // Slide 4: Product & Demo (Interactive Map & Gender Controls)
  `"Let's look at the product live on screen. In our Hyderabad Explore Map, users see real-time neighborhood pins—from Smash Badminton in Gachibowli to Third Wave Coffee in Jubilee Hills. When creating a plan, our AI auto-fills the venue and coordinates, and the host can easily toggle the Women-Only filter. Optimistic chat connects them instantly, and completed plans auto-archive into permanent memories. The entire stack is coded and operational today on React Native with Supabase PostGIS."`,

  // Slide 5: Business Model
  `"Let's focus on our business model—we monetize real-world footfall without intrusive banner ads. First, <mark>Partnered Hotspots</mark>: Cafes, turfs, and climbing gyms pay a recurring <mark>₹2,999 monthly subscription</mark> for featured neighborhood placement. Just two 4-person bookings in an entire month pays for their subscription. Second, <mark>Group Perks and Off-Peak Bookings</mark>: We don't do generic coupons. Venues offer exclusive group deals—like 20% off idle turf hours or complimentary platters—unlocked strictly when 4 verified Along users check in together. We take a 10% to 15% commission on these reservations. Third, ₹49 to ₹99 host boosts. <mark>With just 35 paying venues in Gachibowli and Hitec City, we reach operational breakeven at ₹1,05,000 MRR</mark>."`,

  // Slide 6: Traction & North Star
  `"Our North Star metric isn't screen addiction—it is <mark>Completed Plans</mark>. When two or more people meet up and rate each other, cohort retention jumps by 4.2x. In India's top tech hubs, there are 12 million young professionals spending ₹4,000 to ₹8,000 monthly on weekend recreation. Our app is already fully coded on React Native with PostGIS spatial indexing, zero-latency chat, and AI auto-fill—meaning the technical build risk is already retired."`,

  // Slide 7: The Ask
  `"Today, we are seeking <mark>₹10 Lakhs in pilot financing (~$12,000)</mark> for a 6-month runway in Hyderabad's IT corridor. We are allocating this with strict fiscal discipline: <mark>₹4.5 Lakhs into user acquisition and meetup subsidies</mark>—subsidizing ₹250 off court or cafe bills for early hangouts to spark word-of-mouth; <mark>₹3.5 Lakhs for lean founder and operator stipends</mark> for 6 months; and <mark>₹2.0 Lakhs for cloud infrastructure, APIs, and app store compliance</mark>. By Month 4, we scale to 35 partner venues; by Month 6, Along hits operational breakeven in Hyderabad. Thank you, and we'd love to demo the working app with you!"`
];

// Elements
const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const slideIndicator = document.getElementById('slideIndicator');
const slideDotsContainer = document.getElementById('slideDots');
const progressFill = document.getElementById('progressFill');

const notesToggleBtn = document.getElementById('notesToggleBtn');
const speakerDrawer = document.getElementById('speakerDrawer');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const drawerSlideLabel = document.getElementById('drawerSlideLabel');
const drawerScriptText = document.getElementById('drawerScriptText');

const fullscreenBtn = document.getElementById('fullscreenBtn');

// Timer Elements
const timerDisplay = document.getElementById('timerDisplay');
const timerToggleBtn = document.getElementById('timerToggleBtn');
const timerResetBtn = document.getElementById('timerResetBtn');

let timerSeconds = 300; // 5 minutes
let timerInterval = null;
let isTimerRunning = false;

// 1. Initialize Slide Dots
function initDots() {
  slideDotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `dot ${idx === currentSlideIndex ? 'active' : ''}`;
    dot.title = `Go to slide ${idx + 1}`;
    dot.addEventListener('click', () => goToSlide(idx));
    slideDotsContainer.appendChild(dot);
  });
}

// 2. Go to specific slide
function goToSlide(index) {
  if (index < 0 || index >= SLIDES_COUNT) return;

  slides[currentSlideIndex].classList.remove('active');
  currentSlideIndex = index;
  slides[currentSlideIndex].classList.add('active');

  // Update UI indicators
  const slideTitle = slides[currentSlideIndex].getAttribute('data-title') || `Slide ${currentSlideIndex + 1}`;
  slideIndicator.textContent = `0${currentSlideIndex + 1} / 0${SLIDES_COUNT} — ${slideTitle}`;
  progressFill.style.width = `${((currentSlideIndex + 1) / SLIDES_COUNT) * 100}%`;

  // Update dots
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlideIndex);
  });

  // Update notes
  updateSpeakerNotes();
}

function nextSlide() {
  if (currentSlideIndex < SLIDES_COUNT - 1) {
    goToSlide(currentSlideIndex + 1);
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    goToSlide(currentSlideIndex - 1);
  }
}

// 3. Speaker Notes Drawer
function updateSpeakerNotes() {
  drawerSlideLabel.textContent = `Slide ${currentSlideIndex + 1} of ${SLIDES_COUNT}`;
  drawerScriptText.innerHTML = SPEAKER_SCRIPTS[currentSlideIndex] || 'No script available for this slide.';
}

function toggleSpeakerNotes() {
  speakerDrawer.classList.toggle('hidden');
}

// 4. Timer Logic (5:00 countdown)
function updateTimerUI() {
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  timerDisplay.classList.remove('warning', 'danger');
  if (timerSeconds <= 60 && timerSeconds > 0) {
    timerDisplay.classList.add('warning');
  } else if (timerSeconds <= 0) {
    timerDisplay.classList.add('danger');
  }
}

function toggleTimer() {
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerToggleBtn.textContent = '▶';
  } else {
    isTimerRunning = true;
    timerToggleBtn.textContent = '⏸';
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerToggleBtn.textContent = '▶';
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 300;
  timerToggleBtn.textContent = '▶';
  updateTimerUI();
}

// 5. Fullscreen Toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// 6. Interactive Phone Mockup Tabs (Slide 4)
function initDemoTabs() {
  const tabs = document.querySelectorAll('.feat-tab');
  const mockScreens = document.querySelectorAll('.mock-screen');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = `mock-${tab.getAttribute('data-mockup')}`;
      mockScreens.forEach(screen => {
        screen.classList.toggle('active', screen.id === targetId);
      });
    });
  });

  // Interactive Map Pins on Slide 4
  const pinBadminton = document.getElementById('pinBadminton');
  const pinCoffee = document.getElementById('pinCoffee');
  const pinWomen = document.getElementById('pinWomen');
  const mapBottomSheet = document.getElementById('mapBottomSheet');

  if (pinBadminton && mapBottomSheet) {
    const pins = [pinBadminton, pinCoffee, pinWomen];

    pinBadminton.addEventListener('click', () => {
      pins.forEach(p => p.classList.remove('active'));
      pinBadminton.classList.add('active');
      mapBottomSheet.innerHTML = `
        <div class="sheet-drag-handle"></div>
        <div class="sheet-plan-header">
          <span class="sheet-tag fitness">FITNESS • 4 PAX</span>
          <span class="sheet-dist">📍 1.1 km away</span>
        </div>
        <div class="sheet-title">Badminton Doubles Match</div>
        <div class="sheet-venue">Smash Arena, Gachibowli • Sat, 7:00 AM</div>
        <div class="sheet-footer">
          <div class="sheet-avatars">
            <span class="m-avatar a-rahul" title="Rahul (Host)">👨‍💻</span>
            <span class="m-avatar a-ananya" title="Ananya">👩‍💻</span>
            <span class="m-open-slots">+2 spots</span>
          </div>
          <button class="sheet-join-btn">Request to Join</button>
        </div>
      `;
    });

    pinCoffee.addEventListener('click', () => {
      pins.forEach(p => p.classList.remove('active'));
      pinCoffee.classList.add('active');
      mapBottomSheet.innerHTML = `
        <div class="sheet-drag-handle"></div>
        <div class="sheet-plan-header">
          <span class="sheet-tag" style="background:rgba(255,211,42,0.15); color:#FFD32A;">☕ PARTNER PERK</span>
          <span class="sheet-dist">📍 1.8 km away</span>
        </div>
        <div class="sheet-title">Third Wave Coffee (Jubilee Hills)</div>
        <div class="sheet-venue">Exclusive Along Perk: 15% off for groups of 4+</div>
        <div class="sheet-footer">
          <div class="sheet-avatars">
            <span class="m-avatar">☕</span>
            <span class="m-open-slots" style="color:#2ecc71;">Verified Hotspot</span>
          </div>
          <button class="sheet-join-btn" style="background:#e67e22;">Create Plan Here</button>
        </div>
      `;
    });

    pinWomen.addEventListener('click', () => {
      pins.forEach(p => p.classList.remove('active'));
      pinWomen.classList.add('active');
      mapBottomSheet.innerHTML = `
        <div class="sheet-drag-handle"></div>
        <div class="sheet-plan-header">
          <span class="sheet-tag" style="background:rgba(255,107,129,0.2); color:#ff6b81;">🔒 WOMEN ONLY</span>
          <span class="sheet-dist">📍 0.9 km away</span>
        </div>
        <div class="sheet-title">Sunday Book & Croissant Club</div>
        <div class="sheet-venue">Roast Cafe, Hitec City • Sun, 10:30 AM</div>
        <div class="sheet-footer">
          <div class="sheet-avatars">
            <span class="m-avatar">👩‍🎨</span>
            <span class="m-avatar">👩‍💼</span>
            <span class="m-open-slots" style="color:#FF4757;">1 spot left</span>
          </div>
          <button class="sheet-join-btn" style="background:#e91e63;">Join Hangout</button>
        </div>
      `;
    });
  }

  // Interactive Gender Selector in Mock Create
  const btnReachAll = document.getElementById('btnReachAll');
  const btnReachWomen = document.getElementById('btnReachWomen');
  const reachHint = document.getElementById('reachHint');

  if (btnReachAll && btnReachWomen && reachHint) {
    btnReachAll.addEventListener('click', () => {
      btnReachAll.classList.add('active');
      btnReachWomen.classList.remove('active');
      reachHint.textContent = 'Open to verified badminton players of any gender.';
      reachHint.style.color = '#888';
    });

    btnReachWomen.addEventListener('click', () => {
      btnReachWomen.classList.add('active');
      btnReachAll.classList.remove('active');
      reachHint.textContent = '🔒 Plan visibility & joining restricted strictly to verified female profiles.';
      reachHint.style.color = '#FF4757';
    });
  }
}

// 7. Event Listeners
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);
notesToggleBtn.addEventListener('click', toggleSpeakerNotes);
drawerCloseBtn.addEventListener('click', () => speakerDrawer.classList.add('hidden'));
fullscreenBtn.addEventListener('click', toggleFullscreen);

timerToggleBtn.addEventListener('click', toggleTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
    nextSlide();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    prevSlide();
  } else if (e.key === 'n' || e.key === 'N') {
    toggleSpeakerNotes();
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  } else if (e.key === 't' || e.key === 'T') {
    toggleTimer();
  } else if (e.key === 'r' || e.key === 'R') {
    resetTimer();
  }
});

// Boot
initDots();
goToSlide(0);
initDemoTabs();
updateTimerUI();
