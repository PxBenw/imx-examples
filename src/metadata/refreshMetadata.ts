// run with npm run admin:refresh-metadata

import { AlchemyProvider, JsonRpcProvider } from '@ethersproject/providers';
import { ImmutableX, Config } from '@imtbl/core-sdk';
import { Wallet } from '@ethersproject/wallet';

import dotenv from 'dotenv';
dotenv.config();

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

if (!process.env.OWNER_ACCOUNT_PRIVATE_KEY) {
  throw new Error(
    'OWNER_ACCOUNT_PRIVATE_KEY is not defined in the environment variables',
  );
}

const ethSigner = new Wallet(process.env.OWNER_ACCOUNT_PRIVATE_KEY).connect(
  provider,
);
// Initialize client

// for prod change to Config.PRODUCTION, else use Config.SANDBOX
const config = Config.SANDBOX;
const client = new ImmutableX(config);

// CHECK
// correct prod private key
// correct prod contract address
// config.PRODUCTION or SANDBOX

if (!process.env.COLLECTION_CONTRACT_ADDRESS) {
  throw new Error(
    'COLLECTION_CONTRACT_ADDRESS is not defined in the environment variables',
  );
}
const collectionAddress = process.env.COLLECTION_CONTRACT_ADDRESS;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

(async (): Promise<void> => {
  // Fetch token ids for refresh
  var tokenIds: string[] = [];
  var remaining = 1;
  var cursor: string = '';
  while (remaining != 0) {
    if (cursor == '') {
      let listAssetsResponse = await client.listAssets({
        pageSize: 100,
        collection: collectionAddress,
      });
      let tokenIdBatch: string[] = listAssetsResponse.result.map(
        asset => asset.token_id,
      );
      console.log('batch', tokenIdBatch);
      tokenIds = tokenIds.concat(tokenIdBatch);
      remaining = listAssetsResponse.remaining;
      cursor = listAssetsResponse.cursor;
    } else {
      let listAssetsResponse = await client.listAssets({
        pageSize: 100,
        collection: collectionAddress,
        cursor: cursor,
      });
      let tokenIdBatch: string[] = listAssetsResponse.result.map(
        asset => asset.token_id,
      );
      console.log('batch', tokenIdBatch);
      tokenIds = tokenIds.concat(tokenIdBatch);
      remaining = listAssetsResponse.remaining;
      cursor = listAssetsResponse.cursor;
    }
    await sleep(50);
  }

  console.log(tokenIds);

  const chunkedIds = Array.from(
    { length: Math.ceil(tokenIds.length / 1000) },
    (_, index) => tokenIds.slice(index * 1000, (index + 1) * 1000),
  );

  const chunks = chunkedIds.slice(0, 5000);

  console.log('chunks', chunks);

  for (const chunk of chunks) {
    console.log(chunk);
    let createRefreshRequestParams = {
      collection_address: collectionAddress,
      token_ids: chunk, // Token ids for metadata refresh, limit to 5000 per request
    };
    let createMetadataRefreshResponse = await client.createMetadataRefresh(
      ethSigner,
      createRefreshRequestParams,
    );
    console.log(createMetadataRefreshResponse);
  }
})().catch(e => {
  console.log(e);
  process.exit(1);
});
