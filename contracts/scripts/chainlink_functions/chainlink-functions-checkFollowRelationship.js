// Chainlink Functions source script: Check follow relationship
// Endpoint: https://api.twitterapi.io/twitter/user/check_follow_relationship
// Inputs:
// - secrets.twitterApiKey: X-API-Key value (required)
// - args[0] (required): source_user_name (string)
// - args[1] (required): target_user_name (string)
// Output: ABI-encoded uint256 => 1 if source follows target (data.following === true), else 0

if (!secrets || typeof secrets.twitterApiKey !== "string" || secrets.twitterApiKey.length === 0) {
    throw Error("Missing secrets.twitterApiKey");
  }
  
  let source = (args && typeof args[0] === "string") ? args[0] : "";
  let target = (args && typeof args[1] === "string") ? args[1] : "";
  source = source.replace(/^@/, "").trim();
  target = target.replace(/^@/, "").trim();
  if (!source) throw Error("Missing args[0] source_user_name");
  if (!target) throw Error("Missing args[1] target_user_name");
  
  const baseUrl = "https://api.twitterapi.io/twitter/user/check_follow_relationship";
  const params = new URLSearchParams({ source_user_name: source, target_user_name: target });
  const url = `${baseUrl}?${params.toString()}`;
  console.log(url)
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
  console.log(data)
  const following = Boolean(data?.data?.following);
  return Functions.encodeUint256(following ? 1n : 0n);
  
  
  