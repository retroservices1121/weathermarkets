export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm';

export interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  // Snow: sine-wave offset; Rain: angle; Cloud: scale
  wobble?: number;
  wobbleSpeed?: number;
  drift?: number;
}
