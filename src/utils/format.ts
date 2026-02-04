export const ONE_DECIMAL = 1;
export const CURRENCY_DECIMALS = 0;

export function roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
}

export function formatNumber(value: number): string {
    return value.toFixed(ONE_DECIMAL);
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: CURRENCY_DECIMALS,
        maximumFractionDigits: CURRENCY_DECIMALS,
    }).format(value);
}

export function toPercent(rate: number): number {
    return roundToOneDecimal(rate * 100);
}

export function fromPercent(percent: number): number {
    return percent / 100;
}
