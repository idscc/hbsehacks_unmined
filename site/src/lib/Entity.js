import { Client as XrplClient, Wallet, convertHexToString } from 'xrpl';

class Entity {
    /**
     * @param {string} privateKey - The secret/seed for the wallet
     */
    constructor(privateKey) {
        const WS_URL = "wss://s.altnet.rippletest.net:51233";
        
        this.privateKey = privateKey;
        this.client = new XrplClient(WS_URL);
        this.wallet = Wallet.fromSeed(privateKey);
        
        // In JS, we can't 'await' in a constructor. 
        // You would typically call await entity.getInfo() after instantiation.
        this.data = null;
    }

    /**
     * Fetches account information
     * @returns {Promise<Object>}
     */
    async getInfo() {
        try {
            if (!this.client.isConnected()) {
                await this.client.connect();
            }
        } catch (err) {
            throw new Error(`Failed to connect to XRPL: ${err.message}`);
        }

        const response = await this.client.request({
            command: "account_info",
            account: this.wallet.classicAddress,
            ledger_index: "validated",
            strict: true,
        });

        this.data = response.result;
        return response.result;
    }

    /**
     * Fetches transaction history for the account
     * @returns {Promise<Object>}
     */
    async getTxns() {
        try {
            if (!this.client.isConnected()) {
                await this.client.connect();
            }
        } catch (err) {
            throw new Error(`Failed to connect to XRPL: ${err.message}`);
        }

        const response = await this.client.request({
            command: "account_tx",
            account: this.wallet.classicAddress,
        });

        return response.result;
    }

    /**
     * Fetches details for a specific transaction
     * @param {string} txHash 
     * @returns {Promise<Object>}
     */
    async getTxn(txHash) {
        try {
            if (!this.client.isConnected()) {
                await this.client.connect();
            }
        } catch (err) {
            throw new Error(`Failed to connect to XRPL: ${err.message}`);
        }

        const response = await this.client.request({
            command: "tx",
            transaction: txHash,
        });

        return response.result;
    }

    /**
     * Fetches and decodes Multi-Purpose Token (MPT) Metadata
     * @param {string} issId - The MPT Issuance ID
     * @returns {Promise<string>} - The decoded metadata string
     */
    async getMptMeta(issId) {
        try {
            if (!this.client.isConnected()) {
                await this.client.connect();
            }
        } catch (err) {
            throw new Error(`Failed to connect to XRPL: ${err.message}`);
        }

        const response = await this.client.request({
            command: "ledger_entry",
            mpt_issuance: issId,
        });

        const encoded = response.result.node.MPTokenMetadata;
        
        // Equivalent to decode_mptoken_metadata in Python
        const decoded = convertHexToString(encoded);
        
        return decoded;
    }

    /**
     * Helper to close the connection when done
     */
    async disconnect() {
        if (this.client.isConnected()) {
            await this.client.disconnect();
        }
    }
}

// Equivalent of the if __name__ == '__main__': block
// Only check in Node.js environment (not in browser)
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
    console.log("DO NOT RUN THIS FILE");
    process.exit(1);
}

export default Entity;