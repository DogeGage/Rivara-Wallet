// Rivara Token (DGAGE) Service
class DGAGEService {
    constructor() {
        this.contractAddress = '0x9b359461EDdCEd424e37c1b3d2e54c875a5a319D';
        this.rpcUrls = [
            'https://polygon-rpc.com',
            'https://rpc-mainnet.matic.quiknode.pro',
            'https://polygon.llamarpc.com'
        ];
        this.abi = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function symbol() view returns (string)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ];
        this._decimals = null; // Cache decimals
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

    getProvider(rpcIndex = 0) {
        const ethers = this.getEthers();
        const url = this.rpcUrls[rpcIndex] || this.rpcUrls[0];
        return new ethers.providers.JsonRpcProvider(url);
    }

    async getBalance(address) {
        const ethers = this.getEthers();

        // Try each RPC endpoint until one works
        for (let i = 0; i < this.rpcUrls.length; i++) {
            try {
                const provider = this.getProvider(i);
                const contract = new ethers.Contract(this.contractAddress, this.abi, provider);

                const balance = await contract.balanceOf(address);

                // Fetch and cache decimals if not already known
                if (this._decimals === null) {
                    try {
                        this._decimals = await contract.decimals();
                    } catch {
                        this._decimals = 18; // Default to 18 if call fails
                    }
                }

                return ethers.utils.formatUnits(balance, this._decimals);
            } catch (error) {
                console.warn(`DGAGE balance fetch failed on RPC ${i} (${this.rpcUrls[i]}):`, error.message);
                if (i === this.rpcUrls.length - 1) {
                    console.error('Failed to fetch DGAGE balance on all RPCs:', error);
                    return '0';
                }
            }
        }
        return '0';
    }

    async getBalanceUSD(address) {
        // DGAGE doesn't have a market price yet, return 0
        return 0;
    }

    async sendDGAGE(privateKey, toAddress, amount) {
        try {
            const ethers = this.getEthers();
            const provider = this.getProvider();
            const wallet = new ethers.Wallet(privateKey, provider);
            const contract = new ethers.Contract(this.contractAddress, this.abi, wallet);

            // Use cached decimals or default to 18
            const decimals = this._decimals || 18;
            const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);

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

