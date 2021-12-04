const fetch = require("node-fetch")

fetch("https://authstore-9005e4.netlify.live/", {
  method: "POST",
  body: {
    LICHESS_TOKEN: process.env.LICHESS_TOKEN
  }
}).then(response => {
  console.log(response.status)
  return response.text()
}).then(text => {
  console.log(text)
})