require('dotenv/config');
const fs = require('fs');
const { SecretsManager, createGist} = require('@chainlink/functions-toolkit');
const { ethers } = require('ethers'); // v5

async function main() {
  const RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL;
  const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  // Masked env dump for debugging
  const mask = (name, value) => {
    const sensitive = /KEY|TOKEN|SECRET|PRIVATE/i.test(name);
    if (!value) return 'UNSET';
    if (!sensitive) return value;
    const len = value.length;
    if (len <= 8) return '***';
    return `${value.slice(0, 6)}...${value.slice(-4)} (len=${len})`;
  };
  const envsToShow = [
    'ARBITRUM_SEPOLIA_RPC_URL',
    'PRIVATE_KEY',
    'ETH_PRIVATE_KEY',
    'GITHUB_TOKEN',
    'TWITTER_API_KEY',
    'CHAINLINK_FUNCTIONS_ROUTER_ARB_SEPOLIA',
    'CHAINLINK_DON_ID_ARB_SEPOLIA',
  ];
  console.log('--- Env check (masked) ---');
  for (const key of envsToShow) {
    console.log(`${key}: ${mask(key, process.env[key])}`);
  }
  console.log('---------------------------');

  if (!RPC_URL) throw new Error('Missing ARBITRUM_SEPOLIA_RPC_URL');
  if (!PRIVATE_KEY) throw new Error('Missing PRIVATE_KEY or ETH_PRIVATE_KEY');
  if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN');

  const ROUTER = '0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C';
  const DON_ID ='fun-arbitrum-sepolia-1';

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const secrets = {};
  if (process.env.TWITTER_API_KEY) secrets.twitterApiKey = process.env.TWITTER_API_KEY;
  if (Object.keys(secrets).length === 0) throw new Error('No secrets set (expected TWITTER_API_KEY)');
  console.log('Secrets set');
  const sm = new SecretsManager({ signer, functionsRouterAddress: ROUTER, donId: DON_ID});
  await sm.initialize();
  console.log('SecretsManager initialized');
  // 1) Encrypt secrets
  const encryptedSecrets = await sm.encryptSecrets(secrets);
  console.log('Secrets encrypted');
  // 2) Create a private GitHub gist holding the encryptedSecrets JSON
  const body = {
    description: 'Chainlink Functions encrypted secrets (Debazaar)',
    public: false,
    files: {
      'secrets.json': {
        content: JSON.stringify({ encryptedSecrets }, null, 2),
      },
    },
  };
  console.log('Body set');
  // const resp = await fetch('https://api.github.com/gists', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `token ${GITHUB_TOKEN}`,
  //     'Accept': 'application/vnd.github+json',
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(body),
  // });
  const gistURL = await createGist(
    GITHUB_TOKEN,
    JSON.stringify(encryptedSecrets)
  );
  console.log('Gist URL:', gistURL);
  console.log('Response received');
  // console.log('Response status:', resp.status);
  // if (!resp.ok) {
  //   const text = await resp.text();
  //   throw new Error(`GitHub gist create failed: ${resp.status} ${text}`);
  // }
  // const gist = await resp.json();
  // console.log('Gist created'); 
  // console.log('Gist:', gist);
  // const fileEntry = gist.files?.['secrets.json'];
  // console.log('File entry:', fileEntry);
  // const gistUrl = gist?.html_url;
  if (!gistURL) throw new Error('Failed to obtain gist html_url');
  console.log('Gist URL:', gistURL);
  // 3) Encrypt the gist URL to produce the hex for ENCRYPTED_SECRETS_URLS (use HTML URL per sample)
  const hex = await sm.encryptSecretsUrls([gistURL]);
  console.log('Hex:', hex);
  // Output only the hex so callers can: export ENCRYPTED_SECRETS_URLS=$(node request.js)
  process.stdout.write(hex);
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});


