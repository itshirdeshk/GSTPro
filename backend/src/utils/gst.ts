/**
 * GSTIN format: 2-digit state code + 10-char PAN + 1 entity code + Z + 1 check digit
 * Example: 27AABCT1234M1ZX
 */
export function validateGSTIN(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) return false;

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Extract state code from GSTIN (first 2 digits)
 */
export function getStateCodeFromGSTIN(gstin: string): string {
  return gstin.substring(0, 2);
}

/**
 * Valid GST rates in India
 */
export const VALID_GST_RATES = [0, 5, 12, 18, 28];

/**
 * Validate GST rate
 */
export function isValidGSTRate(rate: number): boolean {
  return VALID_GST_RATES.includes(rate);
}

/**
 * Calculate GST amounts for an item
 */
export function calculateGST(params: {
  amount: number;
  gstRate: number;
  isInterState: boolean;
  isReverseCharge?: boolean;
  isComposition?: boolean;
}): {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalWithTax: number;
} {
  const { amount, gstRate, isInterState, isReverseCharge = false, isComposition = false } = params;

  // Composition scheme dealers cannot charge GST on invoices
  if (isComposition) {
    return {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalWithTax: roundTo2(amount),
    };
  }

  // Reverse charge: tax liability shifts to buyer
  if (isReverseCharge) {
    return {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalWithTax: roundTo2(amount),
    };
  }

  const taxAmount = (amount * gstRate) / 100;

  if (isInterState) {
    // IGST for inter-state transactions
    const igst = roundTo2(taxAmount);
    return {
      cgst: 0,
      sgst: 0,
      igst,
      totalTax: igst,
      totalWithTax: roundTo2(amount + igst),
    };
  } else {
    // CGST + SGST (split equally) for intra-state
    const halfTax = taxAmount / 2;
    const cgst = roundTo2(halfTax);
    const sgst = roundTo2(halfTax);
    return {
      cgst,
      sgst,
      igst: 0,
      totalTax: roundTo2(cgst + sgst),
      totalWithTax: roundTo2(amount + cgst + sgst),
    };
  }
}

/**
 * Determine if a transaction is inter-state
 */
export function isInterStateTransaction(sellerStateCode: string, buyerStateCode: string): boolean {
  return sellerStateCode !== buyerStateCode;
}

/**
 * Round a number to 2 decimal places
 */
export function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Indian state codes map
 */
export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};
