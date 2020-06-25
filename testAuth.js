const fetch = require('node-fetch')
const api = 'http://localhost:9000/api/v1/premium-storage/payment'

const run = async () => {
  const resp = await fetch(api, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer c2b052c7ff2734df84113114a3cb244229b0862c'
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