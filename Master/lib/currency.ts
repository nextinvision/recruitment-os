/**
 * Currency formatting utilities for INR (Indian Rupees)
 */

/**
 * Format a number as Indian Rupees (INR)
 * Uses Indian number system (lakhs, crores)
 * 
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "₹1,23,456.78")
 */
export function formatINR(
  amount: number | string,
  options: {
    showDecimals?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return '₹0'
  }

  const {
    showDecimals = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  // Use 'en-IN' locale for Indian number formatting (lakhs, crores)
  const formatted = numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? minimumFractionDigits : 0,
    maximumFractionDigits: showDecimals ? maximumFractionDigits : 0,
  })

  return `₹${formatted}`
}

/**
 * Format a number as Indian Rupees without decimal places
 * Useful for displaying whole amounts
 */
export function formatINRWhole(amount: number | string): string {
  return formatINR(amount, { showDecimals: false })
}

/**
 * Parse a currency string to number
 * Handles both ₹ and $ symbols, commas, etc.
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols, spaces, and commas
  const cleaned = currencyString.replace(/[₹$,\s]/g, '')
  return parseFloat(cleaned) || 0
}

