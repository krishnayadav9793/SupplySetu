import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';

interface B2bTaxInvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

// Map SKUs to standard Indian FMCG HSN Codes
const HSN_CODE_MAP: Record<string, string> = {
  'PARLE-G-80G': '1905',
  'BRIT-GOODDAY-100G': '1905',
  'MAGGI-NOODLE-70G': '1902',
  'SURF-EXCEL-500G': '3402',
  'TATA-SALT-1KG': '2501',
  'FORTUNE-SOYA-1L': '1507',
  'LIFEBUOY-SOAP-100G': '3401',
  'DETTOL-HW-200ML': '3401',
  'COLGATE-MAX-150G': '3306',
  'HALDIRAM-BHUJIA-400G': '2106',
};

// Convert number to Indian English Currency Words
function numberToIndianWords(num: number): string {
  const rounded = Math.round(num);
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    let res = '';
    if (n >= 100) {
      res += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      res += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      res += a[n] + ' ';
    }
    return res.trim();
  };

  if (rounded === 0) return 'Rupees Zero Only';

  let n = rounded;
  let words = '';

  if (Math.floor(n / 10000000) > 0) {
    words += convertLessThanOneThousand(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += convertLessThanOneThousand(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += convertLessThanOneThousand(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    words += convertLessThanOneThousand(n);
  }

  return `Rupees ${words.trim()} Only`;
}

export const B2bTaxInvoiceModal: React.FC<B2bTaxInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV/JBP/2026/${order.orderNumber.replace('ORD-', '')}`;
  const totalBilledUnits = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalFreeUnits = order.items.reduce((s, i) => s + (i.freeQuantity || 0), 0);
  const taxableSubtotal = order.totalAmount - order.discountAmount;
  const halfGst = Math.round((order.gstAmount / 2) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 print:p-0">
        <div className="relative w-full max-w-4xl rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col border border-slate-200 print:border-none print:shadow-none print:rounded-none">
          {/* Print Styles Override */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #tax-invoice-printable, #tax-invoice-printable * {
                visibility: visible;
              }
              #tax-invoice-printable {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 16px;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

          {/* Modal Header Actions (Hidden in Print) */}
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                B2B GST Tax Invoice ({order.orderNumber})
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'DISPATCHED'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div id="tax-invoice-printable" className="p-6 sm:p-8 space-y-6 text-xs text-slate-800 bg-white">
            {/* Top Distributor Letterhead */}
            <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase block mb-0.5">
                  Madhya Pradesh FMCG Distribution Hub
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  SUPPLYSETU FMCG DISTRIBUTORS PVT. LTD.
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Central Warehouse, Plot 14, Transport Nagar, Madhotal, Jabalpur, MP - 482002
                </p>
                <p className="text-[11px] text-slate-600">
                  Phone: +91 761 2489000 &bull; Email: billing.jbp@supplysetu.in
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] space-y-0.5 font-mono">
                <div><strong>GSTIN:</strong> 23AABCS1429B1Z8</div>
                <div><strong>PAN:</strong> AABCS1429B</div>
                <div><strong>FSSAI Lic:</strong> 11421850000312</div>
                <div><strong>State:</strong> Madhya Pradesh (Code 23)</div>
              </div>
            </div>

            {/* Document Title Bar */}
            <div className="bg-slate-900 text-white py-1.5 px-4 text-center rounded-md font-bold text-xs uppercase tracking-widest flex items-center justify-between">
              <span>TAX INVOICE / कर चालान (Rule 46, CGST Rules 2017)</span>
              <span className="text-[10px] font-mono text-emerald-400">Original for Buyer</span>
            </div>

            {/* Buyer and Invoice Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              {/* Buyer / Kirana Details */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Billed To / Delivered To:
                </span>
                <h3 className="text-sm font-bold text-slate-900">{order.retailer.shopName}</h3>
                <p className="text-slate-600">Proprietor: <strong>{order.retailer.ownerName}</strong></p>
                <p className="text-slate-600">{order.retailer.city}</p>
                <p className="text-slate-600">Contact: {order.retailer.phone}</p>
                <p className="text-slate-700 font-mono text-[11px] pt-1">
                  <strong>Buyer GSTIN/UIN:</strong> {order.retailer.ownerName ? '23AABCP1234D1Z5' : 'Unregistered Kirana'}
                </p>
              </div>

              {/* Invoice Metadata */}
              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Invoice Particulars:
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono text-slate-800">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Date:</span>
                  <span className="text-slate-800 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Channel:</span>
                  <span className="font-medium text-emerald-700">
                    {order.createdVia === 'AI_CAPTURE'
                      ? 'AI WhatsApp Bot'
                      : order.createdVia === 'SALESMAN_APP'
                      ? 'Beat Salesman'
                      : 'Direct Portal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Beat Salesman:</span>
                  <span className="text-slate-800">
                    {order.salesman?.name || 'Vikram Sharma'} ({order.salesman?.phone || '9893000002'})
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-2 text-center">HSN</th>
                    <th className="py-2.5 px-2 text-center">Billed Qty</th>
                    <th className="py-2.5 px-2 text-center text-emerald-700">Free Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-2 text-center">GST</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {order.items.map((item, index) => {
                    const hsn = HSN_CODE_MAP[item.product?.skuCode || ''] || '1905';
                    const taxable = item.unitPrice * item.quantity - (item.discountAmount || 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.product?.name || 'FMCG Product'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.product?.skuCode} &bull; Pack: {item.product?.packSize}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-600">{hsn}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {item.freeQuantity > 0 ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                              +{item.freeQuantity} Free
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ₹{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          ₹{taxable.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                          {item.gstRate}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Tax Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
              {/* Left Column: Bank Details & Terms */}
              <div className="sm:col-span-7 space-y-3">
                {/* Words */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Invoice Amount in Words:
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {numberToIndianWords(order.finalAmount)}
                  </p>
                </div>

                {/* Bank / UPI Details */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bank Account Details for Settlement:
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-slate-700">
                    <div><strong>Bank:</strong> State Bank of India</div>
                    <div><strong>Branch:</strong> Lordganj, Jabalpur</div>
                    <div><strong>A/C No:</strong> 30492817492</div>
                    <div><strong>IFSC:</strong> SBIN0001242</div>
                    <div className="col-span-2 text-emerald-700 font-semibold pt-0.5">
                      <strong>UPI VPA:</strong> supplysetu.distributor@icici
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  Terms & Conditions: Subject to Jabalpur jurisdiction. Goods once sold will not be returned without authorized delivery verification note. Payment due within 7 days.
                </p>
              </div>

              {/* Right Column: Mathematical Summary */}
              <div className="sm:col-span-5 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Total Billed Units:</span>
                  <span className="font-bold text-slate-800">{totalBilledUnits} Boxes / Cases</span>
                </div>
                {totalFreeUnits > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                    <span>Scheme Bonus Goods (Free):</span>
                    <span className="font-bold">+{totalFreeUnits} Free Units</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Gross Item Total:</span>
                  <span className="font-mono text-slate-800">₹{order.totalAmount.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600 font-medium">
                    <span>Trade Schemes Discount:</span>
                    <span className="font-mono">-₹{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono text-slate-800 font-medium">₹{taxableSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono text-slate-800">₹{halfGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>State GST (SGST):</span>
                  <span className="font-mono text-slate-800">₹{halfGst.toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-base font-black text-slate-900 bg-slate-100 px-3 rounded-lg mt-2">
                  <span>Total Invoice Value:</span>
                  <span className="text-emerald-700">₹{order.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 flex items-center justify-between border-t border-slate-200 text-xs text-slate-600">
              <div className="text-center">
                <div className="h-10" />
                <p className="border-t border-slate-300 pt-1 font-semibold">Receiver&apos;s Signature & Stamp</p>
                <p className="text-[10px] text-slate-400">({order.retailer.shopName})</p>
              </div>

              <div className="text-center">
                <div className="h-10 flex items-center justify-center font-serif italic text-emerald-800 font-bold">
                  SupplySetu Authorized
                </div>
                <p className="border-t border-slate-300 pt-1 font-semibold">For SupplySetu FMCG Distributors</p>
                <p className="text-[10px] text-slate-400">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
