import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Config, ImmutableX } from '@imtbl/core-sdk';

import dotenv from 'dotenv';
dotenv.config();

const configEnvironment = Config.SANDBOX; // Or Config.PRODUCTION
const client = new ImmutableX(configEnvironment);

if (!process.env.ALCHEMY_API_KEY) {
  throw new Error(
    'ALCHEMY_API_KEY is not defined in the environment variables',
  );
}

const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL);

if (!process.env.OWNER_ACCOUNT_PRIVATE_KEY) {
  throw new Error(
    'OWNER_ACCOUNT_PRIVATE_KEY is not defined in the environment variables',
  );
}

const ethSigner = new Wallet(process.env.OWNER_ACCOUNT_PRIVATE_KEY).connect(
  provider,
);

// Define types for function parameters
type MintParameters = {
  startingTokenId: number;
  collectionAddress: string;
  ethereumAddresses: string[];
  royalty: number;
};

// Wrap the asynchronous code inside an async function due ts compiler options
const mintGear = async ({
  startingTokenId,
  collectionAddress,
  ethereumAddresses,
  royalty,
}: MintParameters): Promise<void> => {
  try {
    let currentTokenId = startingTokenId;
    // HAD TO PASS ETH SIGNER NOT IN DOCS!
    // USER AND CONTRACT_ADDRESS REQUIRED, DOCS SAYS contractAddress
    // USER INSTEAD OF etherKey IN DOCS
    for (const userAddress of ethereumAddresses) {
      const mintResponse = await client.mint(ethSigner, {
        contract_address: collectionAddress,
        // Specifying contract-wide royalty information
        royalties: [
          {
            // Specifying the contract-wide royalty recipient's wallet address
            recipient: userAddress,
            // Specifying the contract-wide royalty rate for this collection
            percentage: royalty,
          },
        ],
        users: [
          {
            user: userAddress,
            tokens: [
              {
                // Specific NFT token
                id: currentTokenId.toString(),
                blueprint: 'my-on-chain-metadata',
                // Overriding the contract-wide royalty information with token-specific royalty information
                royalties: [
                  {
                    // Same recipient's wallet address
                    recipient: userAddress,
                    // Changed royalty rate for this specific token (i.e. 1% instead of the default 2.5%)
                    percentage: royalty,
                  },
                ],
              },
            ],
          },
        ],
      });
      console.log(`Minted Result Details : ${JSON.stringify(mintResponse)}`);
      currentTokenId++;
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

// Example usage
// Example usage
const mintParameters: MintParameters = {
  startingTokenId: 1, // Starting Token ID
  collectionAddress: '0xC47b556DC0780EF8486A3ec6513599C075c2180e', // Collection Address
  ethereumAddresses: ['0x...', '0x...'], // List of Ethereum Addresses
  royalty: 2.5, // Royalty Percentage
};

mintGear(mintParameters);
