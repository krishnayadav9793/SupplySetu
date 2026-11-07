import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  UploadCloud,
  FileText,
  Volume2,
  Info,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  ValidatedAiOrderCaptureResult,
  ValidatedAiOrderItem,
  AiStatusResponse,
} from '../../types';
import {
  AiOrderService,
  SAMPLE_PROMPTS,
  SAMPLE_PARCHIS,
  SampleParchi,
  generateParchiDataUrl,
} from '../../services/aiOrderService';
import { useCart } from '../../context/CartContext';
import { ProductService } from '../../services/productService';

interface AiOrderPadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InputTab = 'text' | 'parchi' | 'voice';

export const AiOrderPadModal: React.FC<AiOrderPadModalProps> = ({ isOpen, onClose }) => {
  const { addToCart, setIsCartDrawerOpen } = useCart();

  // Tab State
  const [activeTab, setActiveTab] = useState<InputTab>('text');

  // AI Diagnostic State
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

  // Text Tab State
  const [message, setMessage] = useState('');

  // Parchi Tab State
  const [parchiImage, setParchiImage] = useState<string | null>(null);
  const [parchiFileName, setParchiFileName] = useState<string>('');
  const [parchiNotes, setParchiNotes] = useState('');
  const [selectedSampleParchiId, setSelectedSampleParchiId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Tab State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Processing & Confirmation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult] = useState<ValidatedAiOrderCaptureResult | null>(null);
  const [editedItems, setEditedItems] = useState<ValidatedAiOrderItem[]>([]);

  // Query AI Status on Mount / Open
  useEffect(() => {
    if (isOpen) {
      AiOrderService.getAiStatus().then(setAiStatus);
      // Check speech recognition support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSpeechSupported(Boolean(SpeechRecognition));
    }
  }, [isOpen]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Speech Recognition Handlers
  // ----------------------------------------------------
  const startVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. You can use text input or simulation.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(currentTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSimulateVoice = () => {
    setIsRecording(true);
    setVoiceTranscript('');
    setTimeout(() => {
      setVoiceTranscript('Bhaiya 10 peti Parle G, 5 case Maggi noodle, 2 peti Tata namak jaldi bhej dena kal subah');
      setIsRecording(false);
    }, 1800);
  };

  // ----------------------------------------------------
  // Image / Parchi Handlers
  // ----------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParchiFileName(file.name);
    setSelectedSampleParchiId(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setParchiImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleParchi = (parchi: SampleParchi) => {
    setSelectedSampleParchiId(parchi.id);
    setParchiFileName(parchi.title);
    setParchiNotes(parchi.notes);
    const dataUrl = generateParchiDataUrl(parchi);
    setParchiImage(dataUrl);
    setResult(null);
  };

  const handleClearImage = () => {
    setParchiImage(null);
    setParchiFileName('');
    setSelectedSampleParchiId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // Order Processing
  // ----------------------------------------------------
  const handleProcessOrder = async () => {
    setIsProcessing(true);
    setProcessingStep('Initializing AI Order Engine...');

    const stepTimer = setTimeout(() => {
      if (activeTab === 'parchi') {
        setProcessingStep('Gemini Vision: Transcribing handwritten Kirana slip...');
      } else {
        setProcessingStep('Interpreting Hindi, Hinglish, & colloquial units (peti/case)...');
      }
    }, 600);

    const stepTimer2 = setTimeout(() => {
      setProcessingStep('Validating with live Jabalpur warehouse stock & dealer rates...');
    }, 1300);

    try {
      let captureRes: ValidatedAiOrderCaptureResult;

      if (activeTab === 'parchi' && parchiImage) {
        captureRes = await AiOrderService.captureMultimodalOrder({
          imageBase64: parchiImage,
          mimeType: 'image/jpeg',
          textNotes: parchiNotes,
        });
      } else if (activeTab === 'voice' && voiceTranscript) {
        captureRes = await AiOrderService.captureOrder(voiceTranscript);
      } else {
        captureRes = await AiOrderService.captureOrder(message);
      }

      setResult(captureRes);
      setEditedItems(captureRes.items);
    } catch (err) {
      console.error('Failed to capture order:', err);
      alert('Unable to process order. Please verify connection and input.');
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // Item Stepper & Confirmation
  // ----------------------------------------------------
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
          stockWarning: newProduct.stock === 0 ? 'Out of stock in Jabalpur warehouse' : null,
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

  const canProcess =
    (activeTab === 'text' && message.trim().length > 0) ||
    (activeTab === 'parchi' && Boolean(parchiImage)) ||
    (activeTab === 'voice' && voiceTranscript.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-[#12151c] shadow-2xl border border-slate-200 dark:border-[#222736] overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222736] flex items-center justify-between bg-slate-50/70 dark:bg-[#151922]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    AI Multimodal Order Capture
                  </h2>
                  {aiStatus?.isGeminiConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-3 h-3" />
                      Gemini 2.5 Flash Vision
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Info className="w-3 h-3" />
                      Local Kirana FMCG Engine
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transcribe WhatsApp orders, handwritten paper slips (Parchi), or voice notes directly into verified stock carts
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

          {/* Multimodal Mode Selector Tabs */}
          <div className="flex border-b border-slate-200 dark:border-[#222736] px-4 sm:px-6 bg-white dark:bg-[#12151c]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('text');
                setResult(null);
              }}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>💬 WhatsApp / Text</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('parchi');
                setResult(null);
              }}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'parchi'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>📷 Handwritten &ldquo;Parchi&rdquo; Photo</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase font-mono">
                Vision
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('voice');
                setResult(null);
              }}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'voice'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>🎙️ Voice Note</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* TAB 1: TEXT / WHATSAPP */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Paste WhatsApp Order or SMS Message
                  </label>
                  <span className="text-[11px] text-slate-400">Supports Hindi, Hinglish, & English</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. bhaiya 10 peti parle g, 5 case maggi noodle, 2 peti tata namak jaldi bhej dena kal subah..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-[#262c3b] bg-white dark:bg-[#161a23] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xs resize-none"
                  />
                  {message && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessage('');
                        setResult(null);
                      }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
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
                      onClick={() => {
                        setMessage(sample.message);
                        setResult(null);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: HANDWRITTEN PARCHI / BILL PHOTO */}
            {activeTab === 'parchi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Upload Handwritten Order Slip (&ldquo;Parchi&rdquo;) or Invoice Photo
                  </label>
                  <span className="text-[11px] text-slate-400">JPG, PNG, WebP supported</span>
                </div>

                {/* Upload Area / Preview */}
                {!parchiImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-[#161a23]/50 hover:bg-emerald-50/20"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      Click to upload photo or take picture
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Snap a picture of the retailer&apos;s paper order slip or paste a photo
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161a23] p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-48 h-36 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm shrink-0">
                      <img
                        src={parchiImage}
                        alt="Handwritten order slip"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-2 text-left w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-emerald-500" />
                          {parchiFileName || 'Order Slip Attached'}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>

                      {/* Additional Retailer Notes */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                          Optional Notes / Instructions from Retailer:
                        </label>
                        <input
                          type="text"
                          value={parchiNotes}
                          onChange={(e) => setParchiNotes(e.target.value)}
                          placeholder="e.g. Kal dopehar tak urgent delivery chahiye..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#12151c] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Instant Sample Parchi Cards for Demo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Or Try Sample Kirana Slips (1-Click Test):
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_PARCHIS.map((parchi) => (
                      <button
                        key={parchi.id}
                        type="button"
                        onClick={() => handleSelectSampleParchi(parchi)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          selectedSampleParchiId === parchi.id
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161a23] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white mb-1">
                          <span className="truncate">{parchi.title}</span>
                          {selectedSampleParchiId === parchi.id && (
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">
                          {parchi.lines.slice(0, 2).join(', ')}...
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VOICE NOTE AUDIO */}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Record Spoken Order in Kirana Hindi or English
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Language:</span>
                    <select
                      value={speechLanguage}
                      onChange={(e) => setSpeechLanguage(e.target.value as 'hi-IN' | 'en-IN')}
                      className="text-xs py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <option value="hi-IN">🇮🇳 Hindi (हिंदी)</option>
                      <option value="en-IN">English (Indian)</option>
                    </select>
                  </div>
                </div>

                {/* Big Microphone Controller */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161a23] p-6 text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    {isRecording && (
                      <span className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 scale-105'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isRecording ? 'Listening... Speak Kirana items now' : 'Click microphone to start recording'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isRecording
                        ? 'e.g. "Bhaiya 10 peti Parle G, 5 case Maggi noodle bhej dena"'
                        : 'Web Speech API records directly from your microphone'}
                    </p>
                  </div>

                  {/* Fallback Simulation Option */}
                  {!isSpeechSupported && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300">
                      Speech recognition not supported in this browser. Use the simulation button below.
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleSimulateVoice}
                      className="text-xs font-medium text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Or simulate incoming Kirana voice note
                    </button>
                  </div>
                </div>

                {/* Live Transcript Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Live Transcription:
                    </span>
                    {voiceTranscript && (
                      <button
                        type="button"
                        onClick={() => setVoiceTranscript('')}
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    placeholder="Your spoken words will appear here in real-time..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161a23] text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* Action Trigger Button */}
            <button
              type="button"
              disabled={!canProcess || isProcessing}
              onClick={handleProcessOrder}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                !canProcess || isProcessing
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
                  <span>
                    {activeTab === 'parchi'
                      ? 'Scan Parchi with Gemini Vision & Match Catalogue'
                      : activeTab === 'voice'
                      ? 'Process Spoken Voice Order'
                      : 'Interpret & Generate Verified Cart'}
                  </span>
                </>
              )}
            </button>

            {/* AI Results & Human Confirmation Section */}
            {result && (
              <div className="pt-4 border-t border-slate-200 dark:border-[#222736] space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Extracted FMCG Products ({editedItems.length})</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({result.languageDetected})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Human confirmation: Review stock availability, adjust quantities, and swap alternatives.
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
                                  In Stock ({item.stockAvailable} available in Jabalpur warehouse)
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
                                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                                  {item.requestedQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(index, item.requestedQuantity + 1)}
                                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuantityChange(index, 0)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
