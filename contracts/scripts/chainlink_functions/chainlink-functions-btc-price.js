// Chainlink Functions JavaScript source for BTC price verification
// This function retrieves the latest BTC price from the SampleAPIs Bitcoin endpoint

async function main(args) {
  try {
    // No arguments needed for this example
    // Make HTTP request
    const url = 'https://api.sampleapis.com/bitcoin/historical_prices'
    console.log(`HTTP GET Request to ${url}\n`)

    // construct the HTTP Request object
    const btcRequest = Functions.makeHttpRequest({
      url: url,
    })

    // Execute the API request (Promise)
    const btcResponse = await btcRequest
    if (btcResponse.error) {
      console.error(btcResponse.error)
      throw Error("Request failed")
    }

    const data = btcResponse["data"]
    console.log(JSON.stringify(data, null, 2))

    if (!data || data.length === 0) {
      throw Error("No data returned from API")
    }

    // Assuming data is an array of objects with shape like { date: "...", price: 12345 }
    const latestEntry = data[data.length - 1] // last entry is the latest
    console.log(latestEntry)
    const btcPrice = latestEntry.Price

    if (!btcPrice) {
      throw Error("BTC price not found in response")
    }

    // Solidity doesn't support decimals, so multiply by 100 to preserve 2 decimals
    if (btcPrice > 1000) {
      return Functions.encodeUint256(1)
    } else {
      return Functions.encodeUint256(0)
    }
  } catch (error) {
    console.error('BTC price verification failed:', error.message)
    return Functions.encodeUint256(0) // Return 0 on error
  }
}

