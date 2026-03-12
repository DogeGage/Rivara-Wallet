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

    // Scan Ethereum address for ERC-20 tokens
    async scanEthereumTokens(address) {
        try {
            console.log('Scanning Ethereum tokens for:', address);

            // Use Etherscan API to get token list
            const response = await fetch(
                `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc`
            );
            const data = await response.json();

            if (data.status !== '1' || !data.result) {
                console.log('No Ethereum tokens found');
                return [];
            }

            // Get unique token contracts
            const tokenContracts = new Set();
            data.result.forEach(tx => {
                tokenContracts.add(tx.contractAddress);
            });

            // Fetch balance for each token
            const tokens = [];
            for (const contractAddress of tokenContracts) {
                try {
                    const tokenData = await this.getERC20TokenData(address, contractAddress, 'ethereum');
                    if (tokenData && parseFloat(tokenData.balance) > 0) {
                        tokens.push(tokenData);
                    }
                } catch (error) {
                    console.error('Error fetching token data:', error);
                }
            }

            this.detectedTokens.ethereum = tokens;
            console.log('Found', tokens.length, 'Ethereum tokens');
            return tokens;

        } catch (error) {
            console.error('Ethereum token scan error:', error);
            return [];
        }
    }

    // Scan Polygon address for tokens
    async scanPolygonTokens(address) {
        try {
            console.log('Scanning Polygon tokens for:', address);

            // Use Polygonscan API to get token list
            const response = await fetch(
                `https://api.polygonscan.com/api?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc`
            );
            const data = await response.json();

            if (data.status !== '1' || !data.result) {
                console.log('No Polygon tokens found');
                return [];
            }

            // Get unique token contracts
            const tokenContracts = new Set();
            data.result.forEach(tx => {
                tokenContracts.add(tx.contractAddress);
            });

            // Fetch balance for each token
            const tokens = [];
            for (const contractAddress of tokenContracts) {
                try {
                    const tokenData = await this.getERC20TokenData(address, contractAddress, 'polygon');
                    if (tokenData && parseFloat(tokenData.balance) > 0) {
                        tokens.push(tokenData);
                    }
                } catch (error) {
                    console.error('Error fetching token data:', error);
                }
            }

            this.detectedTokens.polygon = tokens;
            console.log('Found', tokens.length, 'Polygon tokens');
            return tokens;

        } catch (error) {
            console.error('Polygon token scan error:', error);
            return [];
        }
    }

    // Get ERC-20 token data (balance, name, symbol)
    async getERC20TokenData(walletAddress, contractAddress, network) {
        try {
            const { ethers } = window.cryptoLibs;

            // Set RPC based on network
            const rpcUrl = network === 'ethereum'
                ? 'https://eth.llamarpc.com'
                : 'https://polygon-rpc.com';

            const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

            // ERC-20 ABI
            const abi = [
                "function balanceOf(address account) view returns (uint256)",
                "function decimals() view returns (uint8)",
                "function symbol() view returns (string)",
                "function name() view returns (string)"
            ];

            const contract = new ethers.Contract(contractAddress, abi, provider);

            // Fetch token info
            const [balance, decimals, symbol, name] = await Promise.all([
                contract.balanceOf(walletAddress),
                contract.decimals(),
                contract.symbol(),
                contract.name()
            ]);

            const formattedBalance = ethers.utils.formatUnits(balance, decimals);

            // Try to get price from CoinGecko
            let priceUSD = 0;
            try {
                const priceResponse = await fetch(
                    `https://api.coingecko.com/api/v3/simple/token_price/${network === 'ethereum' ? 'ethereum' : 'polygon-pos'}?contract_addresses=${contractAddress}&vs_currencies=usd`
                );
                const priceData = await priceResponse.json();
                priceUSD = priceData[contractAddress.toLowerCase()]?.usd || 0;
            } catch (e) {
                console.log('Could not fetch price for', symbol);
            }

            const balanceUSD = (parseFloat(formattedBalance) * priceUSD).toFixed(2);

            return {
                address: walletAddress,
                contractAddress: contractAddress,
                name: name,
                symbol: symbol,
                balance: parseFloat(formattedBalance).toFixed(6),
                balanceUSD: balanceUSD,
                decimals: decimals,
                network: network,
                transactions: []
            };

        } catch (error) {
            console.error('Error getting token data:', error);
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

