// Import the LitJsSdk library from the '@lit-protocol/lit-node-client-nodejs' package
import LitJsSdk from '@lit-protocol/lit-node-client-nodejs';

// Define constants
const LIT_NETWORK = "serrano";
const PKP_PUBLIC_KEY = "0x04f80a948f038f5d69855268f749457d5b465b78fd7bf603de13bd4bf01d718175bf512c828414e227a8289e7512b331658394c4d37a34aec3eca9c585056b7180";
const IPFS_ID = "QmTioWBHeq1rSKdtBZwwsmw59WabAmPr6c8dVcWDHiP7cY";
const AUTH_SIGNATURE = authSig_acc2; // Make sure 'authSig_acc2' is defined earlier
const CLIENT_PARAMS = {
    chain: "ethereum",
    publicKey: PKP_PUBLIC_KEY,
    sigName: "sig1",
    "access_token": "access-sandbox-ba9ee489-90fd-4b20-be28-96f9828cc5da",
    "start_date": "2023-09-23",
    "end_date": "2023-09-23",
    "tr_num": 0,
    "client_id": "650ec5e216ecbb001b12ca1d",
    "secret": "3618a4c3bb886629ad11e32c2e139b"
};

const encryptDecryptString = async () => {
    // Create a new LitNodeClientNodeJs instance
    const litNodeClient = new LitJsSdk.LitNodeClientNodeJs({
        alertWhenUnauthorized: false,
        litNetwork: LIT_NETWORK,
        debug: true,
    });

    // Connect to the Lit Node
    await litNodeClient.connect();

    // Execute a JavaScript function on the Lit Node using constants
    const { signatures, response, logs } = await litNodeClient.executeJs({
        ipfsId: IPFS_ID,
        authSig: AUTH_SIGNATURE,
        jsParams: CLIENT_PARAMS,
    });

    console.log(response);
    console.log(signatures);
    console.log(logs);
}

encryptDecryptString();
