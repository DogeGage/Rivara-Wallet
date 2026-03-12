/**
 * ChangeNow Exchange Service
 */

interface EstimateResponse {
	toAmount: string;
	fromAmount: string;
	estimatedAmount: string;
}

interface ExchangeResponse {
	id: string;
	payinAddress: string;
	payoutAddress: string;
	fromCurrency: string;
	toCurrency: string;
	fromAmount: string;
	toAmount: string;
	refundAddress: string;
	status: string;
}

class ChangeNowService {
	private workerUrl = 'https://api.rivarawallet.xyz';

	// Currency code mapping
	getCurrencyCode(symbol: string): string {
		const mapping: Record<string, string> = {
			'BTC': 'btc',
			'ETH': 'eth',
			'DOGE': 'doge',
			'LTC': 'ltc',
			'SOL': 'sol',
			'XTZ': 'xtz',
			'TRX': 'trx',
			'POL': 'matic'
		};
		return mapping[symbol] || symbol.toLowerCase();
	}

	// Get estimated exchange amount
	async getEstimate(fromCurrency: string, toCurrency: string, amount: string): Promise<EstimateResponse | null> {
		try {
			const url = `${this.workerUrl}/api/changenow/estimate?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}&fromAmount=${amount}`;
			const response = await fetch(url);
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Failed to get estimate:', error);
			return null;
		}
	}

	// Create exchange transaction
	async createExchange(
		fromCurrency: string,
		toCurrency: string,
		fromAmount: string,
		toAddress: string,
		refundAddress: string
	): Promise<ExchangeResponse | null> {
		try {
			const url = `${this.workerUrl}/api/changenow/exchange`;
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fromCurrency,
					toCurrency,
					fromAmount,
					address: toAddress,
					refundAddress
				})
			});
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Failed to create exchange:', error);
			return null;
		}
	}

	// Get exchange status
	async getExchangeStatus(exchangeId: string): Promise<any> {
		try {
			const url = `${this.workerUrl}/api/changenow/status/${exchangeId}`;
			const response = await fetch(url);
			const data = await response.json();
			return data;
		} catch (error) {
			console.error('Failed to get exchange status:', error);
			return null;
		}
	}
}

export const changeNowService = new ChangeNowService();
export default changeNowService;
