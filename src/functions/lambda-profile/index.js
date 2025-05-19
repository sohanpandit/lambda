import axios from 'axios';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import VeevaAuthService from '/opt/nodejs/veeva-auth.js';

// Initialize services
const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'eu-central-1'
});
const veevaAuth = new VeevaAuthService();

// Function to retrieve credentials from Secrets Manager
async function getSecrets(secretName) {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const data = await secretsManager.send(command);
    return JSON.parse(data.SecretString);
  } catch (error) {
    console.error('Error retrieving secrets:', error);
    throw error;
  }
}

async function verifyNPI(npiNumber) {
  const params = {
    version: '2.1',
    number: npiNumber
  };
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://xyz.com/api',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    params: params
  };

  try {
    const response = await axios.request(config);
    let resultCount = response.data.result_count;
    if (resultCount > 0)
      return true;
  } catch (error) {
    console.error('Error fetching npi lookup result:', error);
    return null;
  }
}



// Function to fetch user data
async function fetchUserData(hcpApiUrl, bearerToken, npid) {
  let filters = `primary_country__v:US~hcp.npi_num__v:${npid}`;

  const params = {
    q: '*',
    types: 'HCP',
    states: 'VALID',
    statuses: 'A',
    filters: filters,
    includeMasterResults: 'false',
    returnHighlights: 'false',
    enrichedResults: 'false'
  };

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: hcpApiUrl,
    headers: {
      'Authorization': bearerToken
    },
    params: params
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error('Error fetching HCP data:', error);
    return null;
  }
}

export const handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters;
    const npid = queryParams?.npid;
    
    if (!npid) {
      throw new Error('Missing required NPID parameter');
    }

    const validNPI = await verifyNPI(npid);
    if (!validNPI) {
      throw new Error('Invalid NPI number');
    }

    const secrets = await getSecrets('VeevaApiSecret');
    const { username, password, authApiUrl, hcpApiUrl } = secrets;
    
    const bearerToken = await veevaAuth.getBearerToken(authApiUrl, username, password);
    if (!bearerToken) {
      throw new Error('Failed to obtain authentication token');
    }

    const hcpData = await fetchUserData(hcpApiUrl, bearerToken, npid);
    if (!hcpData) {
      throw new Error('Failed to fetch HCP dataa');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully retrieved user data for NPID: ${npid}`,
        data: hcpData
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.message || 'Internal Server Error'
      })
    };
  }
};