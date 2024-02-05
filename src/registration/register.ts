import fetch from 'node-fetch';
import { AlchemyProvider, JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import {
  ImmutableX,
  Config,
  generateStarkPrivateKey,
  createStarkSigner,
} from '@imtbl/core-sdk';

import dotenv from 'dotenv';
dotenv.config();

// Create Ethereum signer
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error(
    'ALCHEMY_API_KEY is not defined in the environment variables',
  );
}

const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL);

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not defined in the environment variables');
}

const config = Config.SANDBOX; // Or Config.PRODUCTION
const client = new ImmutableX(config);

const ethSigner = new Wallet(process.env.PRIVATE_KEY).connect(provider);

// Create Stark signer
const starkPrivateKey = generateStarkPrivateKey(); // Or retrieve previously generated key
console.log('starkPrivateKey', starkPrivateKey);
const starkSigner = createStarkSigner(starkPrivateKey);

const walletConnection = { ethSigner, starkSigner };

client.registerOffchain(walletConnection);
