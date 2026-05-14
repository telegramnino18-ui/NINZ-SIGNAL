const https = require('https');

https.get('https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=naruto+epic&limit=5', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.data.map(g => g.images.original.url));
    } catch (e) {
      console.error(e);
    }
  });
});
