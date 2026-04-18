const base = require("./app.json");

const config = ({ config: _cfg }) => {
  const cfg = { ...base.expo, ..._cfg };

  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (googleMapsKey) {
    cfg.android = {
      ...cfg.android,
      config: {
        ...cfg.android?.config,
        googleMaps: { apiKey: googleMapsKey },
      },
    };
  }

  if (googleIosClientId) {
    const reversedClientId = `com.googleusercontent.apps.${googleIosClientId.split(".")[0]}`;
    cfg.plugins = (cfg.plugins || []).map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === "@react-native-google-signin/google-signin") {
        return [plugin[0], { ...plugin[1], iosUrlScheme: reversedClientId }];
      }
      return plugin;
    });
  }

  return cfg;
};

module.exports = config;
