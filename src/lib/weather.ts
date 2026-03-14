import { useState, useEffect } from 'react';

// Coordinates for Harmelen, Netherlands
const LAT = 52.0906;
const LON = 4.9619;

export interface WeatherData {
  temperature: number;
  condition: string;
  isRaining: boolean;
  forecast: {
    date: string;
    maxTemp: number;
    minTemp: number;
    rainSum: number;
    weatherCode: number;
  }[];
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe%2FBerlin`);
        const data = await res.json();
        
        // Simple mapping of WMO weather codes to conditions
        const getCondition = (code: number) => {
          if (code <= 3) return 'Zonnig / Bewolkt';
          if (code <= 49) return 'Mistig';
          if (code <= 69) return 'Regen';
          if (code <= 79) return 'Sneeuw';
          if (code <= 99) return 'Onweer';
          return 'Onbekend';
        };

        const currentCode = data.current.weather_code;
        const isRaining = currentCode >= 50 && currentCode <= 69;

        const forecast = data.daily.time.slice(0, 7).map((time: string, i: number) => ({
          date: time,
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          rainSum: data.daily.precipitation_sum[i],
          weatherCode: data.daily.weather_code[i],
        }));

        setWeather({
          temperature: data.current.temperature_2m,
          condition: getCondition(currentCode),
          isRaining,
          forecast,
        });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  return { weather, loading };
}
