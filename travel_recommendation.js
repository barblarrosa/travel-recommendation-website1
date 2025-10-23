const API_URL = "travel_recommendation_api.json";
let DATA = null;

const norm = (s = "") => s.toString().trim().toLowerCase();
const toSingular = (w = "") => {
  const s = norm(w);
  if (s.endsWith("es")) return s.slice(0, -2);
  if (s.endsWith("s")) return s.slice(0, -1);
  return s;
};

function includesAny(haystack, needles = []) {
  const h = norm(haystack);
  return needles.some((n) => n && h.includes(norm(n)));
}

function detectIntent(keyword) {
  const ks = toSingular(keyword);
  if (["beach", "temple"].includes(ks)) return { type: "category", value: ks };
  return { type: "text", value: norm(keyword) };
}

function getCountries() {
  if (!DATA) return [];
  if (Array.isArray(DATA.countries)) return DATA.countries;
  if (Array.isArray(DATA)) return DATA;
  return [];
}

function cityMatchesCategory(city = {}, countryName = "", category = "") {
  const searchable = [
    city.name, city.description, countryName,
    ...(city.keywords || []), ...(city.tags || []),
    ...(city.categories || []), city.type,
  ].filter(Boolean).map(norm).join(" | ");

  const synonyms = category === "beach"
    ? ["beach", "beaches", "coast", "shore", "playa"]
    : ["temple", "temples", "templo", "shrine"];

  return includesAny(searchable, synonyms);
}

function cityMatchesText(city = {}, countryName = "", text = "") {
  const t = norm(text);
  const searchable = [
    city.name, city.description, countryName,
    ...(city.keywords || []), ...(city.tags || []),
  ].filter(Boolean).map(norm).join(" | ");
  return searchable.includes(t) ||
         norm(city.name || "").includes(t) ||
         norm(countryName).includes(t);
}

function renderResults(items = []) {
  const box = document.getElementById("results");
  box.innerHTML = "";

  if (!items.length) {
    box.innerHTML = `<p class="muted">No results. Try “beach”, “temple”, or a country/city.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card result";

    const imgSrc = item.imageUrl || item.image || "";
    const name = item.name || "Unknown";
    const country = item.country ? ` (${item.country})` : "";
    const desc = item.description || "No description available.";

    card.innerHTML = `
      ${imgSrc ? `<img src="${imgSrc}" alt="${name}" class="thumb" />` : ""}
      <div class="info">
        <h3>${name} <span class="country">${country}</span></h3>
        <p>${desc}</p>
        <div class="actions">
          <a href="https://www.google.com/search?q=${encodeURIComponent(name)}" target="_blank" rel="noopener" class="btn">Visit</a>
        </div>
      </div>
    `;
    box.appendChild(card);
  });
}

function search(keywordRaw) {
  const keyword = keywordRaw || "";
  const intent = detectIntent(keyword);
  const countries = getCountries();
  const results = [];

  for (const c of countries) {
    const cName = c.name || "";
    const cities = c.cities || [];
    for (const city of cities) {
      const withCountry = { ...city, country: cName };
      if (intent.type === "category") {
        if (cityMatchesCategory(withCountry, cName, intent.value)) results.push(withCountry);
      } else {
        if (cityMatchesText(withCountry, cName, keyword)) results.push(withCountry);
      }
    }
  }

  // Show all matches; ensures at least 2 when available
  const top = results.slice(0, Math.max(2, results.length));
  renderResults(top);
  return top;
}

function clearResults() {
  document.getElementById("searchInput").value = "";
  document.getElementById("results").innerHTML = "";
}

async function loadData() {
  try {
    const res = await fetch(API_URL);
    DATA = await res.json();
    console.log("TravelReco API data:", DATA); // Task 6 log
  } catch (err) {
    console.error("Failed to load API:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  const input = document.getElementById("searchInput");
  document.getElementById("searchBtn").addEventListener("click", () => search(input.value));
  document.getElementById("clearBtn").addEventListener("click", clearResults);
});
