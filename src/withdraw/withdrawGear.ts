import fetch from 'node-fetch';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { createStarkSigner } from '@imtbl/core-sdk';

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

const ethSigner = new Wallet(process.env.PRIVATE_KEY).connect(provider);

if (!process.env.STARK_PRIVATE_KEY) {
  throw new Error(
    'STARK_PRIVATE_KEY is not defined in the environment variables',
  );
}
// // Create Stark signer
// const starkPrivateKey = generateStarkPrivateKey(); // Or retrieve previously generated key
const starkSigner = createStarkSigner(process.env.STARK_PRIVATE_KEY);

interface ResponseData {
  stark_key: string;
  vault_id: number;
  amount: string; // 'amount' is a string as per your example
  asset_id: string;
  nonce: number;
  payload_hash: string;
  signable_message: string;
  readable_transaction: string;
  verification_signature: string;
}

const withdrawalDetails = {
  amount: '1',
  token: {
    type: 'ERC721',
    data: {
      token_address: '0x6e1b0e24dc4c73a4a34019dbe14b764755697eb9',
      token_id: '5',
    },
  },
  user: '0x82b56283611C72f325D4F3c20404C21E26249121', // Public L1 Ethereum address of withdraw
};

async function fetchData(): Promise<ResponseData | null> {
  try {
    const response = await fetch(
      'https://api.sandbox.x.immutable.com/v1/signable-withdrawal-details',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawalDetails),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data: ResponseData = (await response.json()) as ResponseData;

    // Sign withdrawal
    await signWithdrawal(data);

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function signWithdrawal(ResponseData: ResponseData) {
  const ethSignature = await ethSigner.signMessage(
    ResponseData.signable_message,
  );

  console.log('Obtained eth signature:', ethSignature);

  const starkSignature = await starkSigner.signMessage(
    ResponseData.payload_hash,
  );

  console.log('Obtained stark signature:', starkSignature);

  const withdrawalBody = {
    amount: 'string',
    asset_id: 'string',
    nonce: 0,
    stark_key: 'string',
    stark_signature: 'string',
    vault_id: 0,
  };

  withdrawalBody.amount = ResponseData.amount;
  withdrawalBody.asset_id = ResponseData.asset_id;
  withdrawalBody.nonce = ResponseData.nonce;
  withdrawalBody.stark_key = ResponseData.stark_key;
  withdrawalBody.stark_signature = starkSignature;
  withdrawalBody.vault_id = ResponseData.vault_id;

  console.log('Withdrawal body:', withdrawalBody);

  const response = await fetch(
    'https://api.sandbox.x.immutable.com/v1/withdrawals',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-imx-eth-address': '0x82b56283611C72f325D4F3c20404C21E26249121', // Public Ethereum address of the withdrawing user
        'x-imx-eth-signature': ethSignature,
      },
      body: JSON.stringify(withdrawalBody),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Withdrawal:', data);
}

async function main() {
  const extractedData = await fetchData();
  if (extractedData) {
    console.log('Extracted Data:', extractedData);
    // Use extractedData here or pass it to other functions
  }
}

main();

//FOR NOW JUST GENERATING SIGNER WITH PK BUT WOULD NEED USERS TO CONNECT
