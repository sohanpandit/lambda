import axios from 'axios';

class VeevaAuthService {
  constructor() {}

  // Function to get bearer token
  async getBearerToken(authApiUrl, username, password) {
    console.log(`[VeevaAuth] Initiating auth request to: ${authApiUrl}`);
    let data = {
      'username': username,
      'password': password // Masking password in logs
    };

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: authApiUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data
    };
    console.log('[VeevaAuth] Request config:', { ...config, data: { ...data } });

    try {
      console.log('[VeevaAuth] Sending authentication request...');
      const response = await axios.request(config);
      console.log('[VeevaAuth] Authentication successful, received sessionId');
      return response.data.sessionId;
    } catch (error) {
      console.error('[VeevaAuth] Authentication failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      });
      return null;
    }
  }
}

export default VeevaAuthService;

// Example usage (commented out for production)
const veevaAuth = new VeevaAuthService();
veevaAuth.getBearerToken('fgf','sdfsdf','sdfef');