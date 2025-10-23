// Chainlink Functions source script: Verify tweet text and author
// Endpoint: https://api.twitterapi.io/twitter/tweets
// Inputs:
// - secrets.twitterApiKey: X-API-Key value (required)
// - args[0] (required): tweetId (string)
// - args[1] (required): expectedText (string)
// - args[2] (required): expectedAuthorUserName (string; can include leading @)
// Output: ABI-encoded uint256 => 1 if tweet.text === expectedText AND author.userName === expectedAuthorUserName, else 0

if (!secrets || typeof secrets.twitterApiKey !== "string" || secrets.twitterApiKey.length === 0) {
    throw Error("Missing secrets.twitterApiKey");
  }
  
  const tweetId = (args && typeof args[0] === "string" && args[0].length > 0) ? args[0] : null;
  const expectedText = (args && typeof args[1] === "string") ? args[1] : null;
  let expectedAuthor = (args && typeof args[2] === "string") ? args[2] : "";
  expectedAuthor = expectedAuthor.replace(/^@/, "").trim();
  
  if (!tweetId) throw Error("Missing args[0] tweetId");
  if (!expectedText) throw Error("Missing args[1] expectedText");
  if (!expectedAuthor) throw Error("Missing args[2] expectedAuthorUserName");
  
  const baseUrl = "https://api.twitterapi.io/twitter/tweets";
  const params = new URLSearchParams({ tweet_ids: tweetId });
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
  
  if (!data || !Array.isArray(data.tweets) || data.tweets.length === 0) {
    return Functions.encodeUint256(0n);
  }
  
  const tw = data.tweets.find((t) => String(t?.id) === tweetId) || data.tweets[0];
  const actualTextRaw = (typeof tw?.text === "string") ? tw.text : "";
  const actualAuthor = (typeof tw?.author?.userName === "string") ? tw.author.userName.replace(/^@/, "").trim() : "";
  
  // Normalize text: handle CR/LF and literal "\n" sequences in expected
  const toStr = (v) => (typeof v === "string" ? v : String(v ?? ""));
  const normalizeActual = (s) => toStr(s).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const normalizeExpected = (s) => toStr(s).replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  
  const actualText = normalizeActual(actualTextRaw);
  const expectedTextNorm = normalizeExpected(expectedText);
  
  const matches = (actualText === expectedTextNorm) && (actualAuthor.toLowerCase() === expectedAuthor.toLowerCase());
  return Functions.encodeUint256(matches ? 1n : 0n);
  
  
  