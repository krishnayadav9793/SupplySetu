import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  ShoppingBag,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  HelpCircle,
  Package,
} from 'lucide-react';
import {
  ValidatedAiOrderCaptureResult,
  ValidatedAiOrderItem,
  SamplePrompt,
} from '../../types';
import { AiOrderService, SAMPLE_PROMPTS } from '../../services/aiOrderService';
import { useCart } from '../../context/CartContext';
import { ProductService } from '../../services/productService';

interface AiOrderPadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiOrderPadModal: React.FC<AiOrderPadModalProps> = ({ isOpen, onClose }) => {
  const { addToCart, setIsCartDrawerOpen } = useCart();

  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<ValidatedAiOrderCaptureResult | null>(null);
  const [editedItems, setEditedItems] = useState<ValidatedAiOrderItem[]>([]);

  if (!isOpen) return null;

  const handleSelectSample = (sample: SamplePrompt) => {
    setMessage(sample.message);
    setResult(null);
  };

  const handleSimulateVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    // Simulate recording transcription
    setTimeout(() => {
      setMessage('Bhaiya 10 peti Parle G, 5 case Maggi noodle, 2 peti Tata namak jaldi bhej dena kal subah');
      setIsRecording(false);
    }, 2000);
  };

  const handleProcessOrder = async () => {
    if (!message.trim()) return;

    setIsProcessing(true);
    setProcessingStep('Interpreting Kirana Hindi & English phrasing...');

    const stepTimer = setTimeout(() => {
      setProcessingStep('Mapping terms to distributor SKU catalogue...');
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setProcessingStep('Checking live Jabalpur warehouse stock & calculating rates...');
    }, 1200);

    try {
      const res = await AiOrderService.captureOrder(message);
      setResult(res);
      setEditedItems(res.items);
    } catch (err) {
      console.error('Failed to capture AI order:', err);
      alert('Unable to process order message. Please verify your connection.');
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      setIsProcessing(false);
    }
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setEditedItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setEditedItems((prev) => {
        const updated = [...prev];
        const item = updated[index];
        const subtotal = item.unitPrice * newQty;
        const gst = (subtotal * item.gstRate) / 100;
        updated[index] = {
          ...item,
          requestedQuantity: newQty,
          confirmedQuantity: item.isAvailable ? Math.min(newQty, item.stockAvailable) : 0,
          itemTotal: Math.round((subtotal + gst) * 100) / 100,
        };
        return updated;
      });
    }
  };

  const handleSwapAlternative = async (index: number, altSku: string) => {
    try {
      const newProduct = await ProductService.getProductById(altSku);
      if (!newProduct) return;

      setEditedItems((prev) => {
        const updated = [...prev];
        const old = updated[index];
        const rate = newProduct.pricing?.rate || newProduct.basePrice;
        const subtotal = rate * old.requestedQuantity;
        const gst = (subtotal * (newProduct.gstRate || 18)) / 100;

        updated[index] = {
          ...old,
          sku: newProduct.skuCode,
          productName: newProduct.name,
          brand: newProduct.brand,
          category: newProduct.category,
          packSize: newProduct.packSize,
          unit: newProduct.unit,
          unitPrice: rate,
          mrp: newProduct.mrp,
          gstRate: newProduct.gstRate,
          stockAvailable: newProduct.stock,
          isAvailable: newProduct.stock > 0,
          stockWarning: newProduct.stock === 0 ? 'Out of stock' : null,
          itemTotal: Math.round((subtotal + gst) * 100) / 100,
          reasoning: `Swapped to alternative: ${newProduct.name}`,
        };
        return updated;
      });
    } catch (err) {
      console.warn('Could not swap product:', err);
    }
  };

  const handleTransferToCart = async () => {
    for (const item of editedItems) {
      if (!item.isAvailable || item.requestedQuantity <= 0) continue;
      const product = await ProductService.getProductById(item.sku);
      if (product) {
        addToCart(product, item.requestedQuantity);
      }
    }
    onClose();
    setIsCartDrawerOpen(true);
  };

  const totalCalculatedAmount = editedItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const totalCalculatedUnits = editedItems.reduce((sum, i) => sum + i.requestedQuantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#12151c] shadow-2xl border border-slate-200 dark:border-[#222736] overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222736] flex items-center justify-between bg-slate-50/50 dark:bg-[#151922]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>AI Order Capture Pad</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Gemini NLU
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Convert Hindi, Hinglish, or WhatsApp order messages into verified shopping carts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Input Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Paste WhatsApp Message or Voice Transcript
                </label>
                <button
                  type="button"
                  onClick={handleSimulateVoiceInput}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{isRecording ? 'Listening in Hindi...' : 'Simulate Voice Note'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. bhaiya 5 peti biscuit chhota, 2 peti washing powder, 1 peti tel, aur 2 case colgate bhej do..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-[#262c3b] bg-white dark:bg-[#161a23] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xs resize-none"
                />
                {message && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessage('');
                      setResult(null);
                    }}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sample Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Quick Try:</span>
                {SAMPLE_PROMPTS.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!message.trim() || isProcessing}
                onClick={handleProcessOrder}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  !message.trim() || isProcessing
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.99]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{processingStep}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Interpret & Generate Order Cart</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Results & Human Confirmation Section */}
            {result && (
              <div className="pt-4 border-t border-slate-200 dark:border-[#222736] space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Extracted Products ({editedItems.length})</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({result.languageDetected})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Human confirmation interface: Review, edit quantities, and verify inventory before transfer.
                    </p>
                  </div>

                  {result.hasStockWarnings && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" /> Stock alerts detected
                    </span>
                  )}
                </div>

                {/* Items Grid */}
                <div className="space-y-3">
                  {editedItems.map((item, index) => {
                    const isHigh = item.confidenceLevel === 'HIGH';
                    const isMedium = item.confidenceLevel === 'MEDIUM';

                    return (
                      <div
                        key={item.sku + index}
                        className={`rounded-xl border p-4 transition-all ${
                          !item.isAvailable
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            : item.stockWarning
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                            : 'bg-white dark:bg-[#161a23] border-slate-200 dark:border-[#222736]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          {/* Left: Product & Confidence */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                  isHigh
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : isMedium
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                }`}
                              >
                                {Math.round(item.confidence * 100)}% Match
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                                {item.brand}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {item.sku}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {item.productName}
                            </h4>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <Package className="w-3 h-3 text-slate-400" />
                                {item.packSize}
                              </span>
                              <span>•</span>
                              <span>₹{item.unitPrice.toFixed(2)} / {item.unit}</span>
                            </div>

                            {/* Stock Warning or Success Badge */}
                            <div className="mt-2 text-xs">
                              {item.stockWarning ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {item.stockWarning}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  In Stock ({item.stockAvailable} available)
                                </span>
                              )}
                            </div>

                            {/* Alternative Product Picker */}
                            {item.alternatives.length > 0 && (
                              <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>Switch variant:</span>
                                <select
                                  onChange={(e) => handleSwapAlternative(index, e.target.value)}
                                  defaultValue=""
                                  className="text-xs py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden"
                                >
                                  <option value="" disabled>
                                    Select alternative...
                                  </option>
                                  {item.alternatives.map((alt) => (
                                    <option key={alt.sku} value={alt.sku}>
                                      {alt.productName} (₹{alt.rate.toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Right: Quantity Stepper & Price */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#222736]">
                            <div className="text-right">
                              <div className="text-base font-bold text-slate-900 dark:text-white">
                                ₹{item.itemTotal.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                incl. {item.gstRate}% GST
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(index, item.requestedQuantity - 1)}
                                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                                  {item.requestedQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(index, item.requestedQuantity + 1)}
                                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, 0)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unrecognized Items Banner */}
                {result.unrecognizedItems.length > 0 && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      <span>Unrecognized Phrasing (Needs Attention):</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                      {result.unrecognizedItems.map((u, i) => (
                        <li key={i}>&ldquo;{u}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          {result && editedItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#222736] bg-slate-50 dark:bg-[#151922] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Total Order</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {totalCalculatedUnits} Boxes / Cases
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Estimated Total</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{totalCalculatedAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferToCart}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Transfer Verified Items to Cart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
