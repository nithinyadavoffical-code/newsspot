// ---------- CONFIG ----------
const API_KEY = "634fcc8209d1dd6178fef0b701eeb985";
const BASE_URL = "https://gnews.io/api/v4/top-headlines";
const PROXY = "https://api.codetabs.com/v1/proxy?quest=";

let allArticles = [];
let favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
const container = document.getElementById("news-container");
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("suggestions");
const dropdownArrow = document.getElementById("dropdown-arrow");
const countrySelect = document.getElementById("country-select");
const darkToggle = document.getElementById("dark-toggle");

// ---------- DATETIME + CALENDAR ----------
const dtTime = document.getElementById("dt-time");
const dtDate = document.getElementById("dt-date");
const datetimeCard = document.getElementById("datetime-card");
const calendarDropdown = document.getElementById("calendar-dropdown");
const calendarGrid = document.getElementById("calendar-grid");
const calendarMonthYear = document.getElementById("calendar-month-year");
const prevMonth = document.getElementById("prev-month");
const nextMonth = document.getElementById("next-month");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Static holidays
const staticHolidays = [
  { m: 1, d: 26, label: "Republic Day" },
  { m: 8, d: 15, label: "Independence Day" },
  { m: 10, d: 2, label: "Gandhi Jayanti" },
  { m: 12, d: 25, label: "Christmas" },
];

// Clock
function updateClock() {
  const now = new Date();
  let hrs = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, "0");
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12 || 12;
  dtTime.textContent = `${hrs}:${mins} ${ampm}`;
  dtDate.textContent = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
setInterval(updateClock, 1000);
updateClock();

// Add dynamic upcoming special days
function getUpcomingSpecialDays() {
  const today = new Date();
  const currentYear = today.getFullYear();
  let upcoming = staticHolidays
    .map(h => ({ ...h, date: new Date(currentYear, h.m - 1, h.d) }))
    .filter(h => h.date >= today)
    .sort((a, b) => a.date - b.date);

  return upcoming.slice(0, 3);
}

// Calendar render
function renderCalendar(month, year) {
  calendarGrid.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  calendarMonthYear.textContent = new Date(year, month).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  weekDays.forEach((d) => {
    const head = document.createElement("div");
    head.className = "cal-head";
    head.textContent = d;
    calendarGrid.appendChild(head);
  });

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement("div"));
  }

  const upcomingSpecials = getUpcomingSpecialDays();

  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "cal-day";
    div.textContent = d;

    const thisDate = new Date(year, month, d);
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    if (isToday) div.classList.add("today");

    const holiday = staticHolidays.find(
      (s) => s.m - 1 === month && s.d === d
    );
    if (holiday) {
      div.classList.add("special");
      div.title = holiday.label;
    }

    upcomingSpecials.forEach((h) => {
      if (
        h.date.getDate() === d &&
        h.date.getMonth() === month &&
        h.date.getFullYear() === year
      ) {
        div.classList.add("special");
        div.title = h.label;
      }
    });

    const dayOfWeek = thisDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) div.classList.add("weekend");

    calendarGrid.appendChild(div);
  }
}

datetimeCard.addEventListener("click", () => {
  calendarDropdown.classList.toggle("hidden");
  renderCalendar(currentMonth, currentYear);
});
prevMonth.onclick = () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
};
nextMonth.onclick = () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
};

// ---------- CATEGORY LIST ----------
const categories = [
  { name: "Politics", keywords: ["politics","government","minister","election"] },
  { name: "Technology", keywords: ["technology","ai","software","startup","tech"] },
  { name: "Business", keywords: ["business","company","corporate","market","industry"] },
  { name: "Finance", keywords: ["finance","stock","bank","trading","investment","share"] },
  { name: "Health", keywords: ["health","vaccine","covid","virus","hospital"] },
  { name: "Science", keywords: ["science","research","study","scientist"] },
  { name: "Sports", keywords: ["sports","match","cricket","football","tournament"] },
  { name: "Entertainment", keywords: ["movie","film","music","actor","tv","celebrity"] },
  { name: "Environment", keywords: ["environment","climate","pollution","wildlife"] },
  { name: "Space", keywords: ["space","nasa","satellite","rocket","mars"] },
  { name: "Education", keywords: ["education","student","school","university"] },
  { name: "Travel", keywords: ["travel","tourism","flight","hotel"] },
  { name: "Food", keywords: ["food","restaurant","recipe","chef"] },
  { name: "Lifestyle", keywords: ["lifestyle","fashion","beauty","fitness"] },
  { name: "Automobile", keywords: ["car","vehicle","ev","auto","tesla"] },
  { name: "Crime", keywords: ["crime","police","arrest","murder"] },
  { name: "Weather", keywords: ["weather","storm","rain","heatwave"] },
  { name: "Social Media", keywords: ["facebook","instagram","twitter","tiktok"] }
];

// ---------- FETCH NEWS ----------
async function loadNews() {
  container.innerHTML = "<p>Loading news...</p>";
  const country = countrySelect.value.toLowerCase();
  let url;
  if (country === "all") {
    url = `${BASE_URL}?lang=en&max=50&token=${API_KEY}`;
  } else {
    url = `${BASE_URL}?country=${country}&lang=en&max=50&token=${API_KEY}`;
  }

  try {
    const res = await fetch(PROXY + encodeURIComponent(url));
    const data = await res.json();

    if (!data.articles || data.articles.length === 0) {
      container.innerHTML = "<p>⚠️ No articles available (check API key or quota).</p>";
      return;
    }

    allArticles = data.articles.map(a => ({
      title: a.title || "Untitled",
      link: a.url,
      pubDate: new Date(a.publishedAt),
      source: a.source.name || "Unknown",
      description: a.description || "",
      image: a.image || "https://via.placeholder.com/400x200?text=No+Image"
    }));

    renderNews(allArticles);
  } catch (e) {
    console.error("Error fetching:", e);
    container.innerHTML = "<p>Failed to load news.</p>";
  }
}

// ---------- RENDER ----------
function renderNews(articles) {
  container.innerHTML = "";
  if (!articles.length) {
    container.innerHTML = "<p>No news found.</p>";
    return;
  }

  for (const a of articles) {
    const card = document.createElement("div");
    card.className = "news-card";
    card.innerHTML = `
      <img src="${a.image}" alt="news image" loading="lazy">
      <div class="content">
        <h3>${a.title}</h3>
        <p class="meta">${a.source} • ${a.pubDate.toLocaleString()}</p>
        <a href="${a.link}" target="_blank">Read more →</a>
        <div class="read-controls">
          <button class="read-btn" data-title="${a.title}" data-desc="${a.description}" aria-pressed="false">Read</button>
          <button class="fav-btn">${favourites.includes(a.link) ? "★" : "☆"}</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  }

  setupReadControls();
  setupFavButtons();
}

// ---------- SEARCH + DROPDOWN ----------
function openSuggestions() {
  suggestionsBox.innerHTML = "";
  categories.forEach(c => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = c.name;
    div.onclick = () => {
      searchInput.value = c.name;
      suggestionsBox.classList.add("hidden");
      fetchCategoryNews(c.name);
    };
    suggestionsBox.appendChild(div);
  });
  suggestionsBox.classList.remove("hidden");
}

dropdownArrow.onclick = (e) => {
  e.stopPropagation();
  if (suggestionsBox.classList.contains("hidden")) openSuggestions();
  else suggestionsBox.classList.add("hidden");
};

document.addEventListener("click", e => {
  if (!suggestionsBox.contains(e.target) && !dropdownArrow.contains(e.target))
    suggestionsBox.classList.add("hidden");
});

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) fetchCategoryNews(q);
  }
});

async function fetchCategoryNews(query) {
  container.innerHTML = `<p>Loading ${query} news...</p>`;
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&lang=en&max=50&token=${API_KEY}`;
  try {
    const res = await fetch(PROXY + encodeURIComponent(url));
    const data = await res.json();
    if (!data.articles || !data.articles.length)
      return (container.innerHTML = `<p>No results for "${query}"</p>`);

    const filtered = data.articles.map(a => ({
      title: a.title || "Untitled",
      link: a.url,
      pubDate: new Date(a.publishedAt),
      source: a.source.name || "Unknown",
      description: a.description || "",
      image: a.image || "https://via.placeholder.com/400x200?text=No+Image"
    }));

    renderNews(filtered);
  } catch (e) {
    container.innerHTML = "<p>Failed to fetch category news.</p>";
  }
}

// ---------- COUNTRY + DARK MODE ----------
countrySelect.onchange = loadNews;
darkToggle.onclick = () => {
  const dark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("dark", dark ? "1" : "0");
};
if (localStorage.getItem("dark") === "1") document.documentElement.classList.add("dark");

// ---------- START ----------
loadNews();

// ---------- READ OUT LOUD ----------
let currentUtterance = null;
let currentButton = null;

function setupReadControls() {
  const buttons = document.querySelectorAll(".read-btn");
  buttons.forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", () => {
      const text = btn.dataset.title + ". " + (btn.dataset.desc || "");
      toggleRead(btn, text);
    });
  });
}

function stopReading() {
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  if (currentButton) {
    currentButton.setAttribute("aria-pressed", "false");
    currentButton.textContent = "Read";
    currentButton = null;
  }
  currentUtterance = null;
}

function toggleRead(button, text) {
  if (currentButton === button) return stopReading();
  stopReading();

  const u = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  if (voices.length) {
    const en = voices.find(v => /en/i.test(v.lang)) || voices[0];
    u.voice = en;
  }

  u.onend = stopReading;
  u.onerror = stopReading;
  currentButton = button;
  button.textContent = "Stop";
  button.setAttribute("aria-pressed", "true");
  speechSynthesis.speak(u);
  currentUtterance = u;
}

window.addEventListener("beforeunload", stopReading);
window.addEventListener("visibilitychange", () => {
  if (document.hidden) stopReading();
});

// ---------- FAV BUTTONS ----------
function setupFavButtons() {
  const favBtns = document.querySelectorAll(".fav-btn");
  favBtns.forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener("click", () => {
      const link = btn.parentElement.parentElement.querySelector("a").href;
      if (favourites.includes(link)) {
        favourites = favourites.filter(l => l !== link);
        btn.textContent = "☆";
      } else {
        favourites.push(link);
        btn.textContent = "★";
      }
      localStorage.setItem("favourites", JSON.stringify(favourites));
    });
  });
}

// ---------- FAVOURITES TOGGLE ----------
const favToggleBtn = document.getElementById("fav-toggle-btn");
let showingFavourites = false;
favToggleBtn.addEventListener("click", () => {
  showingFavourites = !showingFavourites;
  if (showingFavourites) {
    favToggleBtn.textContent = "Show All News";
    const favArticles = allArticles.filter(a => favourites.includes(a.link));
    renderNews(favArticles);
  } else {
    favToggleBtn.textContent = "Show Favourites";
    renderNews(allArticles);
  }
});

// ---------- INFINITE SCROLL ----------
let page = 2; // start next page
let loadingMore = false;

async function loadMoreNews() {
  if (loadingMore || showingFavourites) return;
  loadingMore = true;

  const country = countrySelect.value.toLowerCase();
  let url;
  if (country === "all") {
    url = `${BASE_URL}?lang=en&max=50&page=${page}&token=${API_KEY}`;
  } else {
    url = `${BASE_URL}?country=${country}&lang=en&max=50&page=${page}&token=${API_KEY}`;
  }

  try {
    const res = await fetch(PROXY + encodeURIComponent(url));
    const data = await res.json();
    if (!data.articles || data.articles.length === 0) return;

    const newArticles = data.articles.map(a => ({
      title: a.title || "Untitled",
      link: a.url,
      pubDate: new Date(a.publishedAt),
      source: a.source.name || "Unknown",
      description: a.description || "",
      image: a.image || "https://via.placeholder.com/400x200?text=No+Image"
    }));

    allArticles = allArticles.concat(newArticles);
    renderNews(allArticles);
    page++;
  } catch (e) {
    console.error("Error loading more news:", e);
  } finally {
    loadingMore = false;
  }
}

window.addEventListener("scroll", () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
    loadMoreNews();
  }
});

/* ================= WEATHER FEATURE (FIXED) =================
   Uses your OpenWeatherMap API key (inserted below).
   This fix uses the Current Weather endpoint to reliably return icon + condition + temp.
*/

// Weather config (replaced with your provided valid key)
const WEATHER_KEY = "ee349ac487885c7b5e953f6c252f7a48";

// Elements (must exist in HTML — kept IDs consistent)
const weatherCard = document.getElementById("weather-card");
const weatherDropdown = document.getElementById("weather-dropdown");
const weatherCurrentIcon = document.getElementById("weather-icon");
const weatherTemp = document.getElementById("weather-temp");
const weatherCity = document.getElementById("weather-city");
const weatherDaysContainer = document.getElementById("weather-days");
const weatherHourlyContainer = document.getElementById("weather-hourly");
const weatherLocationTitle = document.getElementById("weather-location");

// State
let weatherData = null; // full response (if any)
let weatherHourly = []; // hourly array
let weatherDaily = [];  // daily array
let weatherTimezoneOffset = 0;

// Helper: icon URL
function owIconUrl(icon) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

// Request geolocation then fetch weather (keeps your same function name)
function initWeather() {
  if (!navigator.geolocation) {
    setWeatherUnavailable("Geolocation not supported");
    return;
  }

  // Use getCurrentPosition (non-blocking). Provide clear handlers.
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      await fetchWeatherByCoords(lat, lon);
    } catch (err) {
      console.error("initWeather fetch error:", err);
      // If the fetch failed, try a fallback (Delhi) before giving up
      try {
        await fetchWeatherByCoords(28.6139, 77.2090);
      } catch (e2) {
        setWeatherUnavailable("Weather error");
      }
    }
  }, (err) => {
    console.warn("Geolocation error:", err);
    // If user denied location, attempt fallback location (Delhi)
    fetchWeatherByCoords(28.6139, 77.2090).catch(() => {
      setWeatherUnavailable("Location denied");
    });
  }, { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 10000 });
}

// Set UI when weather not available
function setWeatherUnavailable(msg) {
  if (weatherTemp) weatherTemp.textContent = "--°C";
  if (weatherCity) weatherCity.textContent = msg;
  if (weatherCurrentIcon) {
    if (weatherCurrentIcon.tagName === "IMG") weatherCurrentIcon.src = "";
    else weatherCurrentIcon.innerHTML = "";
  }
  // Also update main weatherCard node if present
  if (weatherCard) {
    weatherCard.innerHTML = `<div class="weather-error">${msg}</div>`;
  }
}

// Fetch weather using Current Weather API (more reliable for free keys)
async function fetchWeatherByCoords(lat, lon) {
  try {
    // Use current weather endpoint to get icon + condition + temp.
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&appid=${WEATHER_KEY}`;
    const res = await fetch(currentUrl);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();

    // Update minimal state so other functions that expect hourly/daily won't break
    weatherData = data;
    weatherHourly = []; // current-only; keep empty so renderWeatherDays handles gracefully
    weatherDaily = [];  // same
    weatherTimezoneOffset = 0;

    // Update current UI safely (use existing element ids if present)
    const icon = (data.weather && data.weather[0] && data.weather[0].icon) ? data.weather[0].icon : "";
    const desc = (data.weather && data.weather[0] && data.weather[0].description) ? data.weather[0].description : "";
    const temp = (data.main && typeof data.main.temp === "number") ? Math.round(data.main.temp) : "--";

    // If the original weatherCurrentIcon element exists and is an <img> or container, set appropriately
    if (weatherCard) {
      // update the main weather-card HTML to show icon + desc + temp consistent with your UI
      weatherCard.innerHTML = `
        <img src="${icon ? owIconUrl(icon) : ''}" alt="${desc}" class="weather-icon" style="width:40px;height:40px;">
        <div class="weather-info">
          <div class="weather-desc" style="text-transform:capitalize">${desc}</div>
          <div class="weather-temp">${temp}°C</div>
          <div class="weather-loc">${data.name || ''}</div>
        </div>
      `;
    } else {
      // fallback to individual elements if they exist
      if (weatherCurrentIcon) {
        if (weatherCurrentIcon.tagName === "IMG") weatherCurrentIcon.src = icon ? owIconUrl(icon) : "";
        else weatherCurrentIcon.innerHTML = icon ? `<img src="${owIconUrl(icon)}" alt="${desc}">` : "";
      }
      if (weatherTemp) weatherTemp.textContent = `${temp}°C`;
      if (weatherCity) weatherCity.textContent = data.name || "";
    }

    // Try reverse geocoding as best-effort (not necessary but kept)
    try {
      const geocodeUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&limit=1&appid=${WEATHER_KEY}`;
      const gRes = await fetch(geocodeUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData && gData[0]) {
          const loc = `${gData[0].name}${gData[0].country ? ", " + gData[0].country : ""}`;
          if (weatherCity) weatherCity.textContent = loc;
          if (weatherLocationTitle) weatherLocationTitle.textContent = loc;
          // if weatherCard exists update weather-loc inside it
          if (weatherCard) {
            const locEl = weatherCard.querySelector(".weather-loc");
            if (locEl) locEl.textContent = loc;
          }
        }
      }
    } catch (e) {
      // ignore reverse-geocode failure — not critical
    }

    // call renderWeatherDays() to keep same flow (it will detect empty daily/hourly and exit gracefully)
    try { renderWeatherDays(); } catch(e) { /* ignore */ }

  } catch (e) {
    console.error("Error fetching weather:", e);
    setWeatherUnavailable("Weather error");
  }
}

// Render daily list in dropdown
function renderWeatherDays() {
  if (!weatherDaysContainer || !weatherHourlyContainer) return;
  weatherDaysContainer.innerHTML = "";
  weatherHourlyContainer.innerHTML = "";
  if (!weatherDaily || !weatherDaily.length) {
    weatherDaysContainer.innerHTML = "<div class='weather-day'>No forecast available</div>";
    return;
  }

  // Render each available daily entry
  weatherDaily.forEach((d, idx) => {
    // d.dt is Unix UTC seconds
    const date = new Date((d.dt + weatherTimezoneOffset) * 1000);
    const dayLabel = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const icon = (d.weather && d.weather[0] && d.weather[0].icon) ? d.weather[0].icon : "";
    const high = Math.round((d.temp && d.temp.max) ? d.temp.max : (d.temp ? d.temp : 0));
    const low = Math.round((d.temp && d.temp.min) ? d.temp.min : (d.temp ? d.temp : 0));

    const div = document.createElement("div");
    div.className = "weather-day";
    div.dataset.dayIndex = idx;
    div.innerHTML = `
      <div class="left">
        <img src="${icon ? owIconUrl(icon) : ''}" alt="" style="width:36px;height:36px;">
        <div class="label">${dayLabel}</div>
      </div>
      <div class="temps">${high}° / ${low}°</div>
    `;
    div.addEventListener("click", () => {
      showHourlyForDay(idx);
    });
    weatherDaysContainer.appendChild(div);
  });

  // show first day's hourly by default
  showHourlyForDay(0);
}

// Show hourly forecast for a selected daily index
function showHourlyForDay(dayIndex) {
  if (!weatherHourlyContainer || !weatherDaily) return;
  weatherHourlyContainer.classList.remove("hidden");
  weatherHourlyContainer.innerHTML = "";

  const dayObj = weatherDaily[dayIndex];
  if (!dayObj) {
    weatherHourlyContainer.innerHTML = "<div>No hourly data</div>";
    return;
  }

  const dayStart = dayObj.dt; // UTC seconds
  const nextDayStart = (weatherDaily[dayIndex+1] && weatherDaily[dayIndex+1].dt) ? weatherDaily[dayIndex+1].dt : dayStart + 86400;

  // hourly dt values are UTC seconds — filter hours that belong to this day UTC-range
  const hoursForDay = weatherHourly.filter(h => h.dt >= dayStart && h.dt < nextDayStart);

  if (!hoursForDay.length) {
    // fallback: show daily summary
    const div = document.createElement("div");
    div.className = "hour-row";
    div.innerHTML = `<div style="font-weight:600">${new Date((dayStart+weatherTimezoneOffset)*1000).toLocaleDateString()}</div>
                     <div>${Math.round(dayObj.temp.max)}° / ${Math.round(dayObj.temp.min)}°</div>`;
    weatherHourlyContainer.appendChild(div);
    return;
  }

  hoursForDay.forEach(h => {
    const time = new Date((h.dt + weatherTimezoneOffset) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const icon = (h.weather && h.weather[0] && h.weather[0].icon) ? owIconUrl(h.weather[0].icon) : "";
    const temp = Math.round(h.temp);
    const row = document.createElement("div");
    row.className = "hour-row";
    row.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><div class="hour-time">${time}</div><img src="${icon}" style="width:28px;height:28px;" alt=""></div>
                     <div class="hour-temp">${temp}°</div>`;
    weatherHourlyContainer.appendChild(row);
  });
}

// Toggle dropdown (matches calendar behaviour)
if (weatherCard) {
  weatherCard.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!calendarDropdown.classList.contains("hidden")) calendarDropdown.classList.add("hidden");
    if (weatherDropdown) weatherDropdown.classList.toggle("hidden");
  });
}

// close weather dropdown when clicking outside
document.addEventListener("click", (e) => {
  const target = e.target;
  if (weatherDropdown && weatherCard) {
    if (!weatherDropdown.contains(target) && !weatherCard.contains(target)) {
      if (!weatherDropdown.classList.contains("hidden")) weatherDropdown.classList.add("hidden");
    }
  }
});

// Also toggle calendar when clicking datetime card (existing)
datetimeCard.addEventListener("click", (e) => {
  e.stopPropagation();
  if (weatherDropdown && !weatherDropdown.classList.contains("hidden")) weatherDropdown.classList.add("hidden");
  calendarDropdown.classList.toggle("hidden");
});

// Initialize weather on load (non-blocking)
initWeather();
