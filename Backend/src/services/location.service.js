import fetch from "node-fetch";

const getCountryFromCity = async (city) => {
    // Use OpenCage Geocoding API to get country from city
    const apiKey = process.env.OPENCAGE_API_KEY;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results.length > 0) {
            return data.results[0].components.country_code.toUpperCase();
        } else {
            throw new Error("No results found for the given city");
        }
    } catch (error) {
        console.error("Error fetching country from city:", error);
        throw new Error("Failed to fetch country from city");
    }   
}

export {getCountryFromCity}