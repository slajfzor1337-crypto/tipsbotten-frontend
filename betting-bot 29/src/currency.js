// Currency utility - converts USD to SEK
// Falls back to a fixed rate if the API is unavailable

let cachedRate = 10.3;
let lastFetched = 0;

export async function getUSDtoSEK() {
  const now = Date.now();
  // Refresh rate every 60 minutes
  if (now - lastFetched < 60 * 60 * 1000) return cachedRate;
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=SEK");
    const data = await res.json();
    if (data?.rates?.SEK) {
      cachedRate = data.rates.SEK;
      lastFetched = now;
    }
  } catch (e) {
    // Keep using cached rate
  }
  return cachedRate;
}

export function toSEK(usd, rate) {
  return (usd * rate).toFixed(0);
}

export function formatSEK(usd, rate) {
  const sek = Math.round(usd * rate);
  return sek.toLocaleString("sv-SE") + " kr";
}
