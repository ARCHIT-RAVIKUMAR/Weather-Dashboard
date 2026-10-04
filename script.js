// Get a free key at https://openweathermap.org/api and paste it here.
// (New keys can take up to a couple of hours to start working.)
const API_KEY = "66c354693c6f347487fef001fcce3797";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const button = form.querySelector("button");
const statusEl = document.getElementById("status");
const currentEl = document.getElementById("current");
const forecastSection = document.getElementById("forecast-section");
const forecastEl = document.getElementById("forecast");

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.className = isError ? "error" : "";
}

// Fetch from the API and turn every kind of failure into a readable message
async function getData(endpoint, city) {
  const url = BASE_URL + "/" + endpoint + "?q=" + encodeURIComponent(city) +
    "&units=metric&appid=" + API_KEY;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    if (!navigator.onLine) {
      throw new Error("No internet connection. Check your connection and try again.");
    }
    throw new Error("The request failed. Please try again.");
  }

  if (res.status === 404) throw new Error('City "' + city + '" was not found. Check the spelling and try again.');
  if (res.status === 401) throw new Error("Invalid API key. Check the key in script.js (new keys can take a while to activate).");
  if (res.status === 429) throw new Error("Too many requests. Wait a moment and try again.");
  if (!res.ok) throw new Error("Something went wrong (error " + res.status + "). Please try again.");

  return res.json();
}

function showCurrent(data) {
  const w = data.weather[0];
  document.getElementById("place").textContent = data.name + ", " + data.sys.country;
  document.getElementById("temp").textContent = Math.round(data.main.temp) + "°C";
  document.getElementById("cond").textContent = w.description;
  document.getElementById("icon").src = "https://openweathermap.org/img/wn/" + w.icon + "@2x.png";
  document.getElementById("icon").alt = w.main;
  document.getElementById("feels").textContent = Math.round(data.main.feels_like) + "°C";
  document.getElementById("humidity").textContent = data.main.humidity + "%";
  document.getElementById("wind").textContent = data.wind.speed + " m/s";
  document.getElementById("pressure").textContent = data.main.pressure + " hPa";
  currentEl.hidden = false;
}

// The forecast endpoint returns data every 3 hours, so group it into days
function showForecast(data) {
  const days = {};
  data.list.forEach(function (item) {
    const date = new Date((item.dt + data.city.timezone) * 1000).toISOString().slice(0, 10);
    const hour = new Date((item.dt + data.city.timezone) * 1000).getUTCHours();
    if (!days[date]) days[date] = { min: item.main.temp_min, max: item.main.temp_max, item: item, gap: Math.abs(hour - 12) };
    const d = days[date];
    d.min = Math.min(d.min, item.main.temp_min);
    d.max = Math.max(d.max, item.main.temp_max);
    if (Math.abs(hour - 12) < d.gap) { d.item = item; d.gap = Math.abs(hour - 12); }
  });

  forecastEl.innerHTML = "";
  Object.keys(days).slice(0, 5).forEach(function (date) {
    const d = days[date];
    const w = d.item.weather[0];
    const name = new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    const card = document.createElement("div");
    card.className = "day";
    card.innerHTML =
      '<p class="name">' + name + '</p>' +
      '<img src="https://openweathermap.org/img/wn/' + w.icon + '@2x.png" alt="' + w.main + '">' +
      '<p class="desc">' + w.description + '</p>' +
      '<p>' + Math.round(d.max) + '° / ' + Math.round(d.min) + '°</p>';
    forecastEl.appendChild(card);
  });
  forecastSection.hidden = false;
}

async function search(city) {
  setStatus("Loading...", false);
  button.disabled = true;
  currentEl.hidden = true;
  forecastSection.hidden = true;

  try {
    const current = await getData("weather", city);
    console.log("Current weather data:", current);
    const forecast = await getData("forecast", city);
    console.log("Forecast data:", forecast);

    showCurrent(current);
    showForecast(forecast);
    setStatus("", false);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    button.disabled = false;
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) {
    setStatus("Please enter a city name.", true);
    return;
  }
  search(city);
});
