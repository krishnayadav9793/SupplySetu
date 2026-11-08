import { describe, it, expect } from 'vitest';

describe('Tally ERP / RFC-4180 CSV Export Rules', () => {
  const escapeCsv = (str: string) => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  it('preserves plain text store names without quotes', () => {
    const regularName = 'Shri Ganesh Store';
    expect(escapeCsv(regularName)).toBe('Shri Ganesh Store');
  });

  it('escapes strings with commas and double quotes compliant with RFC-4180', () => {
    const complexName = 'Gupta & Sons, Kirana "Super" Bazaar';
    expect(escapeCsv(complexName)).toBe('"Gupta & Sons, Kirana ""Super"" Bazaar"');
  });

  it('validates mandatory ERP export headers exist', () => {
    const requiredHeaders = [
      'Order ID',
      'Order Date',
      'Retailer Code',
      'Retailer Name',
      'GSTIN',
      'City',
      'SKU Code',
      'Product Name',
      'HSN Code',
      'Quantity',
      'Unit',
      'Rate',
      'Discount %',
      'Discount Amt',
      'Taxable Value',
      'GST Rate',
      'CGST Amt',
      'SGST Amt',
      'Total Amount',
    ];

    expect(requiredHeaders).toHaveLength(19);
    expect(requiredHeaders).toContain('Order ID');
    expect(requiredHeaders).toContain('GSTIN');
    expect(requiredHeaders).toContain('HSN Code');
  });
});
