// Chainlink Functions source script: Check if a user retweeted a tweet
// Docs: https://docs.twitterapi.io/api-reference/endpoint/get_tweet_retweeters
// Inputs:
// - secrets.twitterApiKey: X-API-Key value (required)
// - args[0] (required): tweetId (string)
// - args[1] (required): userName to check (string; can include leading @)
// Output: ABI-encoded uint256 => 1 if userName is in retweeters list, else 0

if (!secrets || typeof secrets.twitterApiKey !== "string" || secrets.twitterApiKey.length === 0) {
    throw Error("Missing secrets.twitterApiKey");
  }
  
  const tweetId = (args && typeof args[0] === "string" && args[0].length > 0) ? args[0] : null;
  let userName = (args && typeof args[1] === "string") ? args[1] : "";
  userName = userName.replace(/^@/, "").trim();
  if (!tweetId) {
    throw Error("Missing args[0] tweetId");
  }
  if (!userName) {
    throw Error("Missing args[1] userName");
  }
  
  const baseUrl = "https://api.twitterapi.io/twitter/tweet/retweeters";
  const params = new URLSearchParams({ tweetId });
  const url = `${baseUrl}?${params.toString()}`;
  
  let resp;
  try {
    resp = await Functions.makeHttpRequest({
      url,
      method: "GET",
      timeout: 15000,
      headers: {
        "X-API-Key": secrets.twitterApiKey,
        "accept": "application/json",
        "user-agent": "chainlink-functions/1.0",
      },
    });
  } catch (_) {
    return Functions.encodeUint256(0n);
  }
  
  if (!resp || resp.error) {
    return Functions.encodeUint256(0n);
  }
  
  let data = resp.data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (_) { return Functions.encodeUint256(0n); }
  }
  
  if (!data || !Array.isArray(data.users)) {
    return Functions.encodeUint256(0n);
  }
  
  const target = userName.toLowerCase();
  const found = data.users.some((u) => typeof u?.userName === "string" && u.userName.replace(/^@/, "").toLowerCase() === target);
  
  return Functions.encodeUint256(found ? 1n : 0n);
  
  
  