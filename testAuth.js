const fetch = require('node-fetch')
const api = 'http://localhost:9000/api/v1/premium-storage/payment'

const run = async () => {
  const resp = await fetch(api, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer bdd4489920b0023a1e5122d8366a9d4b80261c0b'
    },
    body: JSON.stringify({
      planId: 3,
      priceTube: 2500.00000000,
      duration: 2678400000
    })
  })
  // console.log(resp)
  try {
    const data = await resp.json()
    console.log(data)
  } catch (err) {
    console.log('Error happened: ', err)
  }
}

run().then(() => process.exit(0))
