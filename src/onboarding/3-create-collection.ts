import { Wallet } from '@ethersproject/wallet';
import { ImLogger, WinstonLogger } from '@imtbl/imlogging';
import axios from 'axios';
import {
  generateIMXAuthorisationHeaders,
  getEnv,
  getProvider,
  requireEnvironmentVariable,
} from 'libs/utils';

import env from '../config/client';
import { loggerConfig } from '../config/logging';

const provider = getProvider(env.ethNetwork, env.alchemyApiKey);
const log: ImLogger = new WinstonLogger(loggerConfig);

const component = '[IMX-CREATE-COLLECTION]';

(async (): Promise<void> => {
  const privateKey = requireEnvironmentVariable('OWNER_ACCOUNT_PRIVATE_KEY');
  const collectionContractAddress = requireEnvironmentVariable(
    'COLLECTION_CONTRACT_ADDRESS',
  );
  const projectId = requireEnvironmentVariable('COLLECTION_PROJECT_ID');
  const apiKey = requireEnvironmentVariable('API_KEY');

  const wallet = new Wallet(privateKey);
  const signer = wallet.connect(provider);
  const ownerPublicKey = wallet.publicKey;

  log.info(component, 'Creating collection...', collectionContractAddress);

  const { timestamp, signature } = await generateIMXAuthorisationHeaders(
    signer,
  );
  const createCollectionRequest = {
    /**
     * Edit your values here
     */
    name: 'ChronoForge Weapons',
    description:
      'ChronoForge weapons are in-game weapons wielded by adventurers, providing stats boosts and other passive buffs. Reclaim a time-fractured world at chronoforge.gg',
    contract_address: collectionContractAddress,
    owner_public_key: ownerPublicKey,
    icon_url:
      'https://d3uzvcdvguxi7x.cloudfront.net/images/chronoforge/android-chrome-192x192.png',
    metadata_api_url: 'https://api.pixelminions.io/meta/weapons_imx/',
    collection_image_url:
      'https://d3uzvcdvguxi7x.cloudfront.net/media/armour_imx_square.png',
    project_id: parseInt(projectId, 10),
  };

  const headers: Record<string, string> = {
    'Content-type': 'application/json',
    'IMX-Signature': signature,
    'IMX-Timestamp': timestamp,
    'x-immutable-api-key': apiKey,
  };

  const resp = await axios.post(
    `${getEnv('PUBLIC_API_URL')}/collections`,
    createCollectionRequest,
    {
      headers,
    },
  );

  log.info(component, 'Created collection');
  console.log(JSON.stringify(resp.data, null, 2));
})().catch(e => {
  log.error(component, e.message);
  if (e instanceof Error) {
  }
  if (axios.isAxiosError(e)) {
    // Log detailed Axios error information
    if (e.response) {
      log.error(component, e.response.data);
    } else if (e.request) {
    }
  }
  process.exit(1);
});
