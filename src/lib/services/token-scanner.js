// Automatic Token Detection Service
class TokenScanner {
    constructor() {
        this.detectedTokens = {
            ethereum: [],
            polygon: []
        };

        // Popular tokens to always show
        this.popularTokens = {
            ethereum: [
                { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether USD', symbol: 'USDT' },
                { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', symbol: 'USDC' },
                { address: '0x514910771af9ca656af840dff83e8264ecf986ca', name: 'Chainlink', symbol: 'LINK' },
                { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap', symbol: 'UNI' },
                { address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', name: 'Shiba Inu', symbol: 'SHIB' },
                { address: '0x6982508145454ce325ddbe47a25d4ec3d2311933', name: 'Pepe', symbol: 'PEPE' },
                { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', name: 'Polygon', symbol: 'MATIC' }
            ],
            polygon: [
                { address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', name: 'Tether USD', symbol: 'USDT' },
                { address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', name: 'USD Coin', symbol: 'USDC' },
                { address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', name: 'Wrapped Ether', symbol: 'WETH' },
                { address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', name: 'Wrapped Matic', symbol: 'WMATIC' },
                { address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39', name: 'Chainlink', symbol: 'LINK' },
                { address: '0x9b359461eddced424e37c1b3d2e54c875a5a319d', name: 'Rivara Token', symbol: 'DGAGE' }
            ]
        };
    }

    // Scan Ethereum address for ERC-20 tokens using Ankr Advanced API via worker
    async scanEthereumTokens(address) {
        try {
            console.log('Scanning Ethereum tokens via Worker Ankr endpoint for:', address);

            const response = await fetch('https://api.rivarawallet.xyz/api/ankr/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    blockchains: ['eth']
                })
            });

            if (!response.ok) {
                throw new Error(`Worker returned ${response.status}`);
            }

            const data = await response.json();
            const assets = data?.assets || [];

            const tokens = assets
                .filter(asset => asset.blockchain === 'eth' && asset.contractAddress)
                .map(asset => ({
                    address,
                    contractAddress: asset.contractAddress,
                    name: asset.tokenName || '',
                    symbol: asset.tokenSymbol || '',
                    balance: parseFloat(asset.balance || '0').toFixed(6),
                    balanceUSD: parseFloat(asset.balanceUsd || '0').toFixed(2),
                    decimals: asset.decimals || 18,
                    network: 'ethereum',
                    transactions: []
                }));

            this.detectedTokens.ethereum = tokens;
            console.log('Found', tokens.length, 'Ethereum tokens via Worker');
            return tokens;
        } catch (error) {
            console.error('Ethereum token scan error:', error);
            return [];
        }
    }

    // Scan Polygon address for tokens using Ankr Advanced API via worker
    async scanPolygonTokens(address) {
        try {
            console.log('Scanning Polygon tokens via Worker Ankr endpoint for:', address);

            const response = await fetch('https://api.rivarawallet.xyz/api/ankr/scan', {
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

            const tokens = assets
                .filter(asset => asset.blockchain === 'polygon' && asset.contractAddress)
                .map(asset => ({
                    address,
                    contractAddress: asset.contractAddress,
                    name: asset.tokenName || '',
                    symbol: asset.tokenSymbol || '',
                    balance: parseFloat(asset.balance || '0').toFixed(6),
                    balanceUSD: parseFloat(asset.balanceUsd || '0').toFixed(2),
                    decimals: asset.decimals || 18,
                    network: 'polygon',
                    transactions: []
                }));

            this.detectedTokens.polygon = tokens;
            console.log('Found', tokens.length, 'Polygon tokens via Worker');
            return tokens;
        } catch (error) {
            console.error('Polygon token scan error:', error);
            return [];
        }
    }

    // Get ERC-20 token data (balance, name, symbol) - now uses Worker Ankr endpoint
    async getERC20TokenData(walletAddress, contractAddress, network) {
        try {
            console.log(`Fetching ${network} token ${contractAddress} via Worker`);

            const response = await fetch('https://api.rivarawallet.xyz/api/ankr/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: walletAddress,
                    blockchains: [network === 'ethereum' ? 'eth' : 'polygon']
                })
            });

            if (!response.ok) {
                throw new Error(`Worker returned ${response.status}`);
            }

            const data = await response.json();
            const assets = data?.assets || [];

            // Find the specific token in the response
            const token = assets.find(asset => 
                asset.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
            );

            if (!token) {
                // Token not found or has zero balance
                return {
                    address: walletAddress,
                    contractAddress: contractAddress,
                    name: contractAddress === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || 
                          contractAddress === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' ? 'USD Coin' : 'Unknown',
                    symbol: contractAddress === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' || 
                            contractAddress === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' ? 'USDC' : 'UNKNOWN',
                    balance: '0.000000',
                    balanceUSD: '0.00',
                    decimals: 6,
                    network: network,
                    transactions: []
                };
            }

            return {
                address: walletAddress,
                contractAddress: contractAddress,
                name: token.tokenName || 'Unknown',
                symbol: token.tokenSymbol || 'UNKNOWN',
                balance: parseFloat(token.balance || '0').toFixed(6),
                balanceUSD: parseFloat(token.balanceUsd || '0').toFixed(2),
                decimals: token.decimals || 18,
                network: network,
                transactions: []
            };
        } catch (error) {
            console.error('Failed to fetch token data via Worker:', error);
            return null;
        }
    }

    // Get all detected tokens
    getAllTokens() {
        return {
            ethereum: this.detectedTokens.ethereum,
            polygon: this.detectedTokens.polygon
        };
    }

    // Clear detected tokens
    clear() {
        this.detectedTokens = {
            ethereum: [],
            polygon: []
        };
    }
}

// Export for ES modules
export { TokenScanner };

// SECURITY FIX 3: CommonJS module.exports removed — use ES module imports instead

