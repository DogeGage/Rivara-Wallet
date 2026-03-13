// Rivara Token (DGAGE) Service
class DGAGEService {
    constructor() {
        this.contractAddress = '0x9b359461EDdCEd424e37c1b3d2e54c875a5a319D';
        this.workerUrl = 'https://api.rivarawallet.xyz';
        this._decimals = 18; // DGAGE uses 18 decimals
    }

    async getBalance(address) {
        try {
            console.log('Fetching DGAGE balance via Worker Ankr endpoint');

            const response = await fetch(`${this.workerUrl}/api/ankr/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    blockchains: ['polygon']
                })
            });

            if (!response.ok) {
                throw new Error(`Worker returned ${response.status}`);
            }

            const data = await response.json();
            const assets = data?.assets || [];

            // Find DGAGE token in the response
            const dgageToken = assets.find(asset => 
                asset.contractAddress?.toLowerCase() === this.contractAddress.toLowerCase()
            );

            if (dgageToken && dgageToken.balance) {
                return parseFloat(dgageToken.balance).toFixed(6);
            }

            return '0';
        } catch (error) {
            console.error('Failed to fetch DGAGE balance:', error);
            return '0';
        }
    }

    async getBalanceUSD(address) {
        const balance = await this.getBalance(address);
        // DGAGE doesn't have a market price yet, return 0
        return {
            balance: balance,
            balanceUSD: '0.00'
        };
    }

    getEthers() {
        if (window.cryptoLibs && window.cryptoLibs.ethers) {
            return window.cryptoLibs.ethers;
        }
        if (window.ethers) {
            return window.ethers;
        }
        throw new Error('Ethers library not loaded');
    }

    async sendDGAGE(privateKey, toAddress, amount) {
        try {
            const ethers = this.getEthers();
            // Use Worker's Polygon RPC proxy for sending
            const provider = new ethers.providers.JsonRpcProvider(`${this.workerUrl}/api/polygon/rpc`);
            const wallet = new ethers.Wallet(privateKey, provider);
            
            const abi = [
                "function transfer(address to, uint256 amount) returns (bool)"
            ];
            const contract = new ethers.Contract(this.contractAddress, abi, wallet);

            const amountWei = ethers.utils.parseUnits(amount.toString(), this._decimals);

            // Get current gas price from network
            const feeData = await provider.getFeeData();

            // Use higher gas prices for Polygon (minimum 30 Gwei)
            const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(ethers.utils.parseUnits('30', 'gwei'))
                ? feeData.maxPriorityFeePerGas
                : ethers.utils.parseUnits('30', 'gwei');

            const maxFeePerGas = feeData.maxFeePerGas && feeData.maxFeePerGas.gt(ethers.utils.parseUnits('50', 'gwei'))
                ? feeData.maxFeePerGas
                : ethers.utils.parseUnits('50', 'gwei');

            // Send transaction with proper gas settings
            const tx = await contract.transfer(toAddress, amountWei, {
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                maxFeePerGas: maxFeePerGas
            });

            console.log('DGAGE transaction sent successfully');

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: tx.hash,
                explorerUrl: `https://polygonscan.com/tx/${tx.hash}`
            };
        } catch (error) {
            console.error('DGAGE send error:', error);

            // Check if it's a gas estimation error
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient POL for gas fees. Please add POL to your wallet.');
            } else if (error.message.includes('gas')) {
                throw new Error('Gas estimation failed: ' + error.message);
            }

            throw new Error('Failed to send DGAGE: ' + error.message);
        }
    }

    async getTransactions(address) {
        try {
            // Use Polygonscan API to get ERC-20 token transfers
            const response = await fetch(
                `https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=${this.contractAddress}&address=${address}&page=1&offset=10&sort=desc`
            );
            const data = await response.json();

            if (data.status === '1' && data.result && Array.isArray(data.result)) {
                return data.result.map(tx => ({
                    hash: tx.hash,
                    timestamp: parseInt(tx.timeStamp) * 1000,
                    type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
                    value: (parseInt(tx.value) / 1e18).toFixed(2)
                }));
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch DGAGE transactions:', error);
            return [];
        }
    }
}

// Export for ES modules
export { DGAGEService };

// SECURITY FIX 3: window.* globals and CommonJS exports removed — use ES module imports instead

