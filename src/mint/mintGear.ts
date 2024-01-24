import { AlchemyProvider, JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Config, ImmutableX } from '@imtbl/core-sdk';

const dotenv = require('dotenv');
dotenv.config();

const configEnvironment = Config.SANDBOX; // Or Config.PRODUCTION
const client = new ImmutableX(configEnvironment);

if (!process.env.ALCHEMY_API_KEY) {
  throw new Error(
    'ALCHEMY_API_KEY is not defined in the environment variables',
  );
}

// const provider = new AlchemyProvider(
//   process.env.ETH_NETWORK,
//   process.env.ALCHEMY_API_KEY,
// );

const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL);

if (!process.env.PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY is not defined in the environment variables');
}

const ethSigner = new Wallet(process.env.PRIVATE_KEY).connect(provider);

// Wrap the asynchronous code inside an async function due ts compiler options
const mintGear = async () => {
  try {
    // HAD TO PASS ETH SIGNER NOT IN DOCS!
    // USER AND CONTRACT_ADDRESS REQUIRED, DOCS SAYS contractAddress
    // USER INSTEAD OF etherKey IN DOCS
    const mintResponse = await client.mint(ethSigner, {
      contract_address: '0x6E1B0e24DC4c73a4a34019DbE14b764755697eB9',
      // Specifying contract-wide royalty information
      royalties: [
        {
          // Specifying the contract-wide royalty recipient's wallet address
          recipient: '0x5d1266e2B7eAc3fe473a50a53Cf7CacF341fb505',
          // Specifying the contract-wide royalty rate for this collection
          percentage: 2.5,
        },
      ],
      users: [
        {
          user: '0x5d1266e2b7eac3fe473a50a53cf7cacf341fb505',
          tokens: [
            {
              // Specific NFT token
              id: '5',
              blueprint: 'my-on-chain-metadata',
              // Overriding the contract-wide royalty information with token-specific royalty information
              royalties: [
                {
                  // Same recipient's wallet address
                  recipient: '0x5d1266e2B7eAc3fe473a50a53Cf7CacF341fb505',
                  // Changed royalty rate for this specific token (i.e. 1% instead of the default 2.5%)
                  percentage: 1,
                },
              ],
            },
          ],
        },
      ],
    });
    console.log(`Minted Result Details : ${JSON.stringify(mintResponse)}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

mintGear();
