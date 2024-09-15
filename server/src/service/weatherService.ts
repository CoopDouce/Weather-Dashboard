import dotenv from 'dotenv';
dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
}
class Weather { 
  city: string;
  date: string;
  icon: string;
  iconDescription: string;
  tempF: number;
  windSpeed: number;
  humidity: number;
 
  constructor(
    city: string, 
    date: string, 
    icon: string, 
    iconDescription: string, 
    tempF: number, 
    windSpeed: number, 
    humidity: number) 
    {
    this.city = city;
    this.date = date;
    this.icon = icon;
    this.iconDescription = iconDescription;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
  }
}
class WeatherService {
  private baseURL?: string;
  private apiKey?: string;
  cityName: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || '';
    this.apiKey = process.env.API_KEY || '';
    this.cityName = '';
  }
  private async fetchLocationData(query: string) {
    try {
      const response = await fetch(
        query
      );
      const locationData = await response.json();
      return locationData;
    } catch (err) {
      console.log('Error:', err);
      return err;
    }
  }
  private destructureLocationData(locationData: any[]): Coordinates {
    const lat = parseFloat(locationData[0].lat);
    const lon = parseFloat(locationData[0].lon); 
    console.info(`line 68 lat: ${lat}, lon: ${lon}`);
    return { lat, lon };
  }
  private buildGeocodeQuery(): string {
    return `${this.baseURL}/geo/1.0/direct?q=${this.cityName}&appid=${this.apiKey}`;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    console.info(`lat=${coordinates.lat} and lon=${coordinates.lon}`);
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;

  }
  private async fetchAndDestructureLocationData() {
    const locationData = await this.fetchLocationData(this.buildGeocodeQuery());
    const coordinates =  this.destructureLocationData(locationData);
    return coordinates;
  }
  private async fetchWeatherData(coordinates: Coordinates) {
    try {
      const response = await fetch (
        this.buildWeatherQuery(coordinates)
      )
      const weatherData = await response.json();
      return weatherData;
    } catch (err) {
      console.log('Error fetching weather data', err);
      return err;
    }
  }
  private parseCurrentWeather(response: any) {
    const currentWeatherData = response;
    const {dt, weather, main, wind} = currentWeatherData;
    const city = this.cityName;
    const date = new Date(dt * 1000).toLocaleDateString();
    const icon = weather && weather.length > 0 ? weather[0].icon : '';
    const iconDescription = weather && weather.length > 0 ? weather[0].description : '';
    const tempF = main?.temp || 0; 
    const windSpeed = wind?.speed || 0; 
    const humidity = main?.humidity || 0; 
  
    return new Weather(city, date, icon, iconDescription, tempF, windSpeed, humidity);
  }
  private buildForecastArray(currentWeather: Weather, weatherData: any[]) {
    console.log(`Current Weather line 123: weatherData`, weatherData);

    const filterDataWeather = weatherData.filter((data:any) => {
      return data.dt_txt.includes('12:00:00')
    }) 
    console.log(filterDataWeather)
    const forecastArray: any[] = [];
    for(let i = 0; i<filterDataWeather.length; i++) {
      forecastArray.push(this.parseCurrentWeather(filterDataWeather[i]))
    }
       return [currentWeather, ...forecastArray];
    ;
  }
  async getWeatherForCity(city: string) {
  
    try {
    this.cityName = city;
    const coordinates : Coordinates = await this.fetchAndDestructureLocationData();
    
    const weatherData = await this.fetchWeatherData(coordinates);

    const currentWeather = this.parseCurrentWeather(weatherData.list[0]);
    console.info(`Current Weather line 144 current weather`, currentWeather);

    return this.buildForecastArray(currentWeather, weatherData.list);
    } catch (err) {
      console.log('Error getting weather for city', err);
      throw err;
  }
}
};

export default new WeatherService();