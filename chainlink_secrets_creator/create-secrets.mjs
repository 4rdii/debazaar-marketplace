import 'dotenv/config';
import { SecretsManager } from '@chainlink/functions-toolkit';
import { ethers } from 'ethers'; // v5

const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.ETH_PRIVATE_KEY;
const ROUTER = '0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C';
let DON_ID_INPUT = 'fun-arbitrum-sepolia-1';
// Strip wrapping quotes if present
if ((DON_ID_INPUT.startsWith('"') && DON_ID_INPUT.endsWith('"')) || (DON_ID_INPUT.startsWith("'") && DON_ID_INPUT.endsWith("'"))) {
  DON_ID_INPUT = DON_ID_INPUT.slice(1, -1).trim();
}

if (!RPC_URL) throw new Error('Missing ETHEREUM_SEPOLIA_RPC_URL or ARBITRUM_SEPOLIA_RPC_URL');
if (!PRIVATE_KEY) throw new Error('Missing PRIVATE_KEY or ETH_PRIVATE_KEY');

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const donId = DON_ID_INPUT;

const main = async () => {
  const sm = new SecretsManager({ signer, functionsRouterAddress: ROUTER, donId });
  await sm.initialize();

  const secrets = {};
  if (process.env.TWITTER_API_KEY) secrets.TWITTER_API_KEY = process.env.TWITTER_API_KEY;
  if (Object.keys(secrets).length === 0) throw new Error('No secrets found in env (expected TWITTER_API_KEY, etc).');

  const offchainUrl = process.env.OFFCHAIN_SECRETS_URL;
  if (offchainUrl) {
    const urlsHex = await sm.encryptSecretsUrls([offchainUrl]);
    console.log(urlsHex[0]);
    return;
  }

  const encryptedSecrets = await sm.encryptSecrets(secrets);
  console.log(JSON.stringify({ encryptedSecrets }, null, 2));
};

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});


