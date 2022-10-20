/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};

process.env = Object.assign(process.env, {
  TEAMSFX_API_BINGAPI_ENDPOINT: 'http://www.bing.com/HPImageArchive.aspx',
  TEAMSFX_API_BINGAPI_USERNAME: 'bing',
  TEAMSFX_API_BINGAPI_PASSWORD: '',
  TEAMSFX_API_GOOGLEMAPSAPI_ENDPOINT:'https://maps.googleapis.com/maps/api',
  TEAMSFX_API_GOOGLEMAPSAPI_API_KEY: ''
});