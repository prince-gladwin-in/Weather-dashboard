const DEFAULT_CITY = 'Vadodara';
const WEATHER_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '❄️' },
  73: { label: 'Moderate snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Heavy rain showers', icon: '🌧️' },
  82: { label: 'Violent rain showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Severe thunderstorm with hail', icon: '⛈️' },
};

const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000;

const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const searchButton = document.getElementById('searchButton');
const errorMessage = document.getElementById('errorMessage');
const weatherLoading = document.getElementById('weatherLoading');
const weatherContent = document.getElementById('weatherContent');
const locationLabel = document.getElementById('locationLabel');
const countryLabel = document.getElementById('countryLabel');
const statusBadge = document.getElementById('statusBadge');
const weatherSymbol = document.getElementById('weatherSymbol');
const temperatureValue = document.getElementById('temperatureValue');
const weatherCondition = document.getElementById('weatherCondition');
const feelsLikeLabel = document.getElementById('feelsLikeLabel');
const latitudeValue = document.getElementById('latitudeValue');
const longitudeValue = document.getElementById('longitudeValue');
const lastUpdatedLabel = document.getElementById('lastUpdatedLabel');
const humidityValue = document.getElementById('humidityValue');
const windSpeedValue = document.getElementById('windSpeedValue');
const feelsLikeValue = document.getElementById('feelsLikeValue');
const pressureValue = document.getElementById('pressureValue');
const visibilityValue = document.getElementById('visibilityValue');
const recentSearches = document.getElementById('recentSearches');
const favoriteButton = document.getElementById('favoriteButton');
const favoriteCityLabel = document.getElementById('favoriteCityLabel');
const themeToggle = document.getElementById('themeToggle');

let currentCity = DEFAULT_CITY;
let autoRefreshTimer = null;

function applyTheme(theme) {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = resolvedTheme;
  localStorage.setItem('weather-theme', resolvedTheme);
  themeToggle.innerHTML = resolvedTheme === 'dark' ? '<span aria-hidden="true">☀️</span>' : '<span aria-hidden="true">🌙</span>';
  themeToggle.setAttribute('aria-label', resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function getStoredTheme() {
  const savedTheme = localStorage.getItem('weather-theme');
  return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('visible');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.remove('visible');
}

function showLoading(isLoading) {
  weatherLoading.classList.toggle('hidden', !isLoading);
  weatherContent.classList.toggle('hidden', isLoading);
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? 'Searching...' : 'Search';
}

function formatTimeStamp(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatValue(value, suffix = '') {
  if (typeof value === 'undefined' || value === null || Number.isNaN(Number(value))) {
    return '--';
  }

  return `${Math.round(Number(value))}${suffix}`;
}

function getWeatherMeta(code) {
  const fallback = { label: 'Weather conditions', icon: '🌤️' };
  return WEATHER_CODES[code] || fallback;
}

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem('weather-recent') || '[]');
  } catch {
    return [];
  }
}

function saveRecentSearch(city) {
  const trimmedCity = city.trim();
  if (!trimmedCity) return;

  const searches = getRecentSearches();
  const nextSearches = [trimmedCity, ...searches.filter((item) => item.toLowerCase() !== trimmedCity.toLowerCase())].slice(0, 6);
  localStorage.setItem('weather-recent', JSON.stringify(nextSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const searches = getRecentSearches();
  recentSearches.innerHTML = '';

  if (!searches.length) {
    recentSearches.innerHTML = '<div class="history-item">No recent searches yet</div>';
    return;
  }

  searches.forEach((city) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.textContent = city;
    button.addEventListener('click', () => searchCity(city));
    recentSearches.appendChild(button);
  });
}

function getFavoriteCity() {
  try {
    return localStorage.getItem('weather-favorite') || '';
  } catch {
    return '';
  }
}

function setFavoriteCity(city) {
  if (!city) {
    localStorage.removeItem('weather-favorite');
    favoriteCityLabel.textContent = 'No favorite saved';
    favoriteButton.textContent = '☆ Add to favorites';
    favoriteButton.classList.remove('active');
    return;
  }

  localStorage.setItem('weather-favorite', city);
  favoriteCityLabel.textContent = city;
  favoriteButton.textContent = '★ Favorited';
  favoriteButton.classList.add('active');
}

function updateFavoriteState(city) {
  const favoriteCity = getFavoriteCity();
  const isFavorite = favoriteCity && city.toLowerCase() === favoriteCity.toLowerCase();

  if (favoriteCity && isFavorite) {
    favoriteCityLabel.textContent = favoriteCity;
    favoriteButton.textContent = '★ Favorited';
    favoriteButton.classList.add('active');
    return;
  }

  favoriteCityLabel.textContent = favoriteCity || 'No favorite saved';
  favoriteButton.textContent = favoriteCity ? '☆ Replace favorite' : '☆ Add to favorites';
  favoriteButton.classList.toggle('active', Boolean(favoriteCity));
}

function updateLastUpdated() {
  lastUpdatedLabel.textContent = formatTimeStamp(new Date());
  statusBadge.innerHTML = '<span class="status-dot" aria-hidden="true"></span>Live • Updated recently';
}

function updateAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }

  autoRefreshTimer = setInterval(() => {
    if (currentCity) {
      searchCity(currentCity, { silent: true, isAutoRefresh: true });
    }
  }, AUTO_REFRESH_INTERVAL);
}

function normalizeLocationName(locationName, adminArea, countryName) {
  if (!locationName) {
    return adminArea || countryName || 'Location';
  }

  if (adminArea && locationName !== adminArea) {
    return `${locationName}, ${adminArea}`;
  }

  return locationName;
}

function renderWeather(weatherData) {
  const current = weatherData?.current;

  if (!current || typeof current.temperature_2m === 'undefined') {
    throw new Error('Weather data is unavailable.');
  }

  const weatherMeta = getWeatherMeta(current.weather_code);
  const locationName = weatherData?.location?.name || currentCity;
  const adminArea = weatherData?.location?.admin1 || '';
  const countryName = weatherData?.location?.country || 'Unknown';

  locationLabel.textContent = normalizeLocationName(locationName, adminArea, countryName);
  countryLabel.textContent = countryName;
  weatherSymbol.textContent = weatherMeta.icon;
  temperatureValue.textContent = formatValue(current.temperature_2m, '°C');
  weatherCondition.textContent = weatherMeta.label;
  feelsLikeLabel.textContent = `Feels like ${formatValue(current.apparent_temperature, '°C')}`;
  latitudeValue.textContent = formatValue(weatherData?.location?.latitude, '');
  longitudeValue.textContent = formatValue(weatherData?.location?.longitude, '');
  humidityValue.textContent = formatValue(current.relative_humidity_2m, '%');
  windSpeedValue.textContent = formatValue(current.wind_speed_10m, ' km/h');
  feelsLikeValue.textContent = formatValue(current.apparent_temperature, '°C');
  pressureValue.textContent = formatValue(current.pressure_msl, ' hPa');
  visibilityValue.textContent = formatValue(current.visibility / 1000, ' km');

  updateLastUpdated();
  updateFavoriteState(currentCity);
}

async function getCityCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Weather service unavailable');
  }

  const data = await response.json();
  const result = data?.results?.[0];

  if (!result) {
    throw new Error(`We couldn't find weather data for "${city}". Try another city.`);
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    name: result.name,
    country: result.country || 'Unknown',
    admin1: result.admin1 || '',
  };
}

async function getWeatherForLocation(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,weather_code,visibility&timezone=auto&forecast_days=1`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Weather service unavailable');
  }

  const data = await response.json();

  if (!data?.current || typeof data.current.temperature_2m === 'undefined') {
    throw new Error('Weather data is unavailable.');
  }

  return {
    location: {
      name: currentCity,
      country: data.timezone ? data.timezone.split('/')[0] || 'Unknown' : 'Unknown',
      admin1: '',
      latitude,
      longitude,
    },
    current: data.current,
  };
}

async function searchCity(cityName, options = {}) {
  const trimmedCity = cityName.trim();
  const { silent = false, isAutoRefresh = false } = options;

  if (!trimmedCity) {
    showLoading(false);
    showError('Please enter a city name.');
    return;
  }

  if (!silent) {
    clearError();
    showLoading(true);
  }

  try {
    const location = await getCityCoordinates(trimmedCity);
    const weather = await getWeatherForLocation(location.latitude, location.longitude);
    const resolvedLocation = {
      ...weather.location,
      name: location.name,
      admin1: location.admin1,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    currentCity = location.name;
    renderWeather({ ...weather, location: resolvedLocation });
    saveRecentSearch(location.name);
    updateAutoRefresh();

    if (!isAutoRefresh) {
      cityInput.value = location.name;
    }

    showLoading(false);
    clearError();
  } catch (error) {
    showLoading(false);

    const message = error instanceof Error && error.message
      ? error.message
      : 'Unable to connect to the weather service. Please check your internet connection.';

    const normalizedMessage = /Failed to fetch|fetch/i.test(message) || /NetworkError|TypeError/.test(String(error))
      ? 'Unable to connect to the weather service. Please check your internet connection.'
      : message;

    showError(normalizedMessage);
  }
}

function handleThemeToggle() {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

function initializeDashboard() {
  applyTheme(getStoredTheme());
  currentCity = DEFAULT_CITY;
  cityInput.value = DEFAULT_CITY;
  renderRecentSearches();
  updateFavoriteState(DEFAULT_CITY);
  showLoading(true);
  searchCity(DEFAULT_CITY, { silent: true });
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchCity(cityInput.value);
});

favoriteButton.addEventListener('click', () => {
  const favoriteCity = getFavoriteCity();
  const nextCity = favoriteCity && currentCity.toLowerCase() === favoriteCity.toLowerCase() ? '' : currentCity;

  if (nextCity) {
    setFavoriteCity(nextCity);
    updateFavoriteState(currentCity);
    return;
  }

  setFavoriteCity('');
});

themeToggle.addEventListener('click', handleThemeToggle);

initializeDashboard();
