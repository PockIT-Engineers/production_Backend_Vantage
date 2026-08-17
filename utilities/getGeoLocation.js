const axios = require("axios");

async function geocodeAddress(fullAddress) {
    try {
        if (!fullAddress || !fullAddress.trim()) {
            console.warn("❌ Empty address received");
            return fail("EMPTY_ADDRESS");
        }

        const normalizedSearchKey = fullAddress
            .replace(/\s+/g, " ")
            .replace(/,+/g, ",")
            .trim();

        console.log("🔎 Searching:", normalizedSearchKey);

        const geoResponse = await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: normalizedSearchKey,
                    key: 'AIzaSyDT0rIRA3oOkwIhszO4xoZIiYfzkTc_4WY',
                    region: "in"   // improves India accuracy
                },
                timeout: 8000
            }
        );

        const status = geoResponse?.data?.status;
        console.log("📡 Google Status:", status);

        // ---- Handle Google errors properly ----
        if (status === "REQUEST_DENIED") {
            console.error("🔥 API KEY ISSUE:", geoResponse.data.error_message);
            return fail("API_KEY_ERROR");
        }

        if (status === "OVER_QUERY_LIMIT") {
            console.error("🔥 Quota exceeded");
            return fail("QUOTA_EXCEEDED");
        }

        if (status === "ZERO_RESULTS") {
            console.warn("⚠ No results found");
            return fail("NO_RESULTS");
        }

        if (status !== "OK") {
            console.error("🔥 Unknown Google error:", geoResponse.data);
            return fail(status);
        }

        // ---- Extract Best Result ----
        const result = geoResponse.data.results[0];

        const location = result.geometry.location;

        const response = {
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress: result.formatted_address,
            accuracy: result.geometry.location_type, // ROOFTOP / APPROXIMATE
            status: "SUCCESS"
        };

        console.log("📍 Coordinates:", response);
        console.log("***********************************");

        return response;

    } catch (error) {
        console.error("🔥 Geocode Exception:", error.message);
        return fail("SERVER_ERROR");
    }
}

function fail(reason) {
    return {
        latitude: null,
        longitude: null,
        formattedAddress: null,
        accuracy: null,
        status: reason
    };
}

module.exports = geocodeAddress;

geocodeAddress("maharashtra, india, 411033")
    .then(console.log)
    .catch(console.error);
