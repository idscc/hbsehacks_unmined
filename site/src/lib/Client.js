import xrpl from 'xrpl';
import Entity from './Entity.js';

class Client extends Entity {
    /**
     * @param {string} seed - The secret/seed for the wallet
     */
    constructor(seed) {
        super(seed);
    }

    /**
     * Authorizes a Multi-Purpose Token (MPT) issuance
     * @param {string} issId - The MPT Issuance ID
     */
    async allowMpt(issId) {
        if (!this.client.isConnected()) await this.client.connect();
        
        const transaction = {
            TransactionType: "MPTokenAuthorize",
            Account: this.wallet.classicAddress,
            MPTokenIssuanceID: issId,
        };

        // Autofill, sign, and submit
        const response = await this.client.submitAndWait(transaction, {
            wallet: this.wallet
        });
        
        return response;
    }

    /**
     * Sends an MPT (Hold) to a receiver
     * @param {string} rx - Receiver address
     * @param {string} issId - The MPT Issuance ID
     * @param {number|string} qty - Quantity to send
     * @returns {Promise<string>} - The transaction hash
     */
    async sendHold(rx, issId, qty) {
        if (!this.client.isConnected()) await this.client.connect();
        
        const transaction = {
            TransactionType: "Payment",
            Account: this.wallet.classicAddress,
            Destination: rx,
            Amount: {
                mpt_issuance_id: issId,
                value: qty.toString(),
            },
        };

        const response = await this.client.submitAndWait(transaction, {
            wallet: this.wallet
        });

        return response.result.hash;
    }

    /**
     * Sends XRP to a specific address
     * @param {string} address - Destination address
     * @param {number|string} qty - Amount in drops (1 XRP = 1,000,000 drops)
     * @returns {Promise<string>} - The transaction hash
     */
    async sendXrp(address, qty) {
        if (!this.client.isConnected()) await this.client.connect();
        
        const transaction = {
            TransactionType: "Payment",
            Account: this.wallet.classicAddress,
            Destination: address,
            Amount: qty.toString(), // XRP amount must be a string in drops
        };

        const response = await this.client.submitAndWait(transaction, {
            wallet: this.wallet
        });

        return response.result.hash;
    }
}

// Equivalent of the if __name__ == '__main__': block
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("DO NOT RUN THIS FILE");
    process.exit(1);
}

export default Client;