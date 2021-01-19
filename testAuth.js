const fetch = require('node-fetch')
const api = 'http://localhost:9000/api/v1/premium-storage/'

const run = async () => {
  // const resp = await fetch(api + 'plan-payment', {
  //   method: 'POST',
  //   headers: {
  //     'Accept': 'application/json',
  //     'Content-Type': 'application/json',
  //     'Authorization': 'Bearer c2b052c7ff2734df84113114a3cb244229b0862c'
  //   },
  //   body: JSON.stringify({
  //     planId: 3,
  //     priceTube: 2500.00000000,
  //     duration: 2678400000
  //   })
  // })

  const resp2 = await fetch(api + 'get-user-payments', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer c2b052c7ff2734df84113114a3cb244229b0862c'
    }
  })
  const resp3 = await fetch(api + 'get-all-active-payments', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer c2b052c7ff2734df84113114a3cb244229b0862c'
    }
  })
  const resp4 = await fetch(api + 'get-user-active-payment', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer c2b052c7ff2734df84113114a3cb244229b0862c'
    }
  })
  // console.log(resp)
  try {
    // const data = await resp.json()
    // const data2 = await resp2.json()
    // const data3 = await resp3.json()
    const data4 = await resp4.json()

    // console.log(data)
    // console.log('Payments: ', data2)
    // console.log('All active payments', data3)
    console.log('User active payment', data4)
  } catch (err) {
    console.log('Error happened: ', err)
  }
}

run().then(() => process.exit(0))
