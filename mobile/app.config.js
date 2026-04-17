const base = require("./app.json");

const config = ({ config: _cfg }) => {
  const cfg = { ...base.expo, ..._cfg };

  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleMapsKey) {
    cfg.android = {
      ...cfg.android,
      config: {
        ...cfg.android?.config,
        googleMaps: { apiKey: googleMapsKey },
      },
    };
  }

  return cfg;
};

module.exports = config;
