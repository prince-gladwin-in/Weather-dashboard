# WeatherFlow Dashboard

A responsive real-time weather dashboard built with vanilla HTML, CSS, and JavaScript. It uses the Open-Meteo geocoding and forecast APIs to search cities and show live weather conditions.

## Features

- Search any city by name
- Live weather metrics: temperature, humidity, wind speed, pressure, visibility
- Last updated timestamp and 10-minute auto-refresh
- Loading, empty state, and API error handling
- Recent searches and favorite city support
- Light/dark mode
- Mobile-friendly responsive layout

## Run locally

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Project structure

- `index.html` — app layout
- `styles.css` — dashboard styling and responsive design
- `app.js` — API fetching, state, and UI logic

## Deployment

This project is static and can be deployed to GitHub Pages, Netlify, or Vercel.
