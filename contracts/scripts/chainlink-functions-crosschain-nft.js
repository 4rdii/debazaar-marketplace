// Chainlink Functions source script
// Checks ERC-721 ownerOf(tokenId) and returns 1 if it equals expected owner, else 0
// Args:
// - args[0]: rpcUrl (e.g., https://eth.llamarpc.com)
// - args[1]: nft contract address (0x...)
// - args[2]: tokenId (decimal string or number)
// - args[3]: expected owner address (0x...)

// Validate inputs
if (!args || typeof args[0] !== "string" || args[0].length === 0) {
    throw Error("Missing args[0] rpcUrl");
  }
  if (typeof args[1] !== "string" || !args[1].startsWith("0x") || args[1].length !== 42) {
    throw Error("Invalid args[1] nft contract address");
  }
  if (args[2] === undefined || args[2] === null || (typeof args[2] !== "string" && typeof args[2] !== "number")) {
    throw Error("Invalid args[2] tokenId");
  }
  if (typeof args[3] !== "string" || !args[3].startsWith("0x") || args[3].length !== 42) {
    throw Error("Invalid args[3] expected owner address");
  }
  
  const rpcUrl = args[0];
  const nft = args[1];
  const tokenIdBig = BigInt(args[2].toString());
  const expected = args[3].toLowerCase();
  
  // ownerOf(uint256) selector = bytes4(keccak256("ownerOf(uint256)")) = 0x6352211e
  const selector = "6352211e";
  
  // 32-byte left-padded tokenId hex
  let tokenHex = tokenIdBig.toString(16);
  if (tokenHex.length > 64) {
    throw Error("tokenId too large");
  }
  tokenHex = tokenHex.padStart(64, "0");
  const data = `0x${selector}${tokenHex}`;
  
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to: nft,
        data,
      },
      "latest",
    ],
  };
  
  let resp;
  try {
    resp = await Functions.makeHttpRequest({
      url: rpcUrl,
      method: "POST",
      timeout: 12000,
      headers: { "content-type": "application/json" },
      data: payload,
    });
  } catch (e) {
    throw Error(`RPC request failed: ${e}`);
  }
  
  if (!resp) {
    throw Error("No response from RPC endpoint");
  }
  if (resp.error) {
    throw Error(`RPC HTTP error: ${resp.error}`);
  }
  
  const result = resp.data?.result;
  if (!result || typeof result !== "string" || !result.startsWith("0x")) {
    const rpcError = resp.data?.error?.message || "Malformed eth_call response";
    throw Error(`eth_call error: ${rpcError}`);
  }
  
  // ABI-decoded address is right-most 20 bytes of 32-byte word
  // result is hex string like 0x000...000<40-hex-addr>
  const clean = result.slice(2);
  if (clean.length < 64) {
    throw Error("eth_call returned short data");
  }
  const ownerHex = clean.slice(-40);
  const ownerAddr = ("0x" + ownerHex).toLowerCase();
  
  const isMatch = ownerAddr === expected;
  return Functions.encodeUint256(isMatch ? 1n : 0n);
  
  
  