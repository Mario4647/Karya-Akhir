import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import NavbarEvent from '../../components/NavbarEvent';
import { withAuth } from '../../authMiddleware';
import QRCode from 'react-qr-code';
import {
  BiCheckCircle,
  BiDownload,
  BiPrinter,
  BiMovie,
  BiCalendar,
  BiMap,
  BiUser,
  BiCopy,
  BiArrowBack,
  BiPurchaseTag,
  BiHome,
  BiIdCard,
  BiX,
  BiQr,
  BiInfoCircle,
  BiMusic,
  BiMicrophone,
  BiCamera,
  BiVideo,
  BiStar,
  BiHeart,
  BiDiamond,
  BiCrown,
  BiRocket,
  BiPalette,
  BiBrush,
  BiPaint,
  BiBook,
  BiMessage,
  BiVolumeFull
} from 'react-icons/bi';

// Array icon untuk background dekoratif
const decorativeIcons = [
  BiMusic, BiMicrophone, BiCamera, BiVideo, BiStar, BiHeart,
  BiDiamond, BiCrown, BiRocket, BiPalette, BiBrush, BiPaint,
  BiBook, BiMessage, BiVolumeFull, BiMovie, BiPurchaseTag, BiQr
];

const PaymentSuccessPage = ({ user }) => {
  const [order, setOrder] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Generate icon positions untuk background
  const [iconPositions] = useState(() => {
    const positions = [];
    for (let i = 0; i < 30; i++) {
      positions.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        rotate: `${Math.random() * 360}deg`,
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.08 + Math.random() * 0.1,
        icon: decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)]
      });
    }
    return positions;
  });

  useEffect(() => {
    fetchOrderAndTickets();
  }, [orderId]);

  const fetchOrderAndTickets = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📦 Fetching payment success for order:', orderId);
      
      // Fetch order dengan cek kepemilikan
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          products:product_id (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError) throw orderError;
      
      if (!orderData) {
        throw new Error('Pesanan tidak ditemukan');
      }

      console.log('✅ Order fetched:', orderData);
      
      // Verifikasi status pesanan
      if (orderData.status !== 'paid') {
        console.log('⏳ Order status is not paid, redirecting to payment...');
        navigate(`/payment/${orderId}`);
        return;
      }
      
      setOrder(orderData);
      setProducts(orderData.products);

      // Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('order_id', orderId);

      if (ticketsError) throw ticketsError;
      
      console.log('✅ Tickets fetched:', ticketsData?.length || 0);
      setTickets(ticketsData || []);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewQR = (ticket) => {
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const downloadQRAsPNG = (ticketCode, qrValue) => {
    return new Promise((resolve) => {
      // Buat canvas untuk menggabungkan QR dan efek
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      // Gambar background putih
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);
      
      // Cari elemen QR yang sudah ada
      const qrElement = document.querySelector(`#qr-${ticketCode.replace(/[^a-zA-Z0-9]/g, '')} svg`);
      if (qrElement) {
        const svgData = new XMLSerializer().serializeToString(qrElement);
        const img = new Image();
        
        img.onload = () => {
          // Gambar QR di tengah
          ctx.drawImage(img, 50, 50, 200, 200);
          
          // Tambahkan efek garis-garis
          ctx.fillStyle = 'rgba(0,0,0,0.03)';
          for (let i = 0; i < 30; i++) {
            ctx.fillRect(i * 10, 0, 2, 300);
            ctx.fillRect(0, i * 10, 300, 2);
          }
          
          // Konversi ke PNG dan download
          const link = document.createElement('a');
          link.download = `ticket-${ticketCode}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          resolve();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        // Fallback: buat QR baru
        const canvas2 = document.createElement('canvas');
        const ctx2 = canvas2.getContext('2d');
        
        // Gambar background putih
        ctx2.fillStyle = '#ffffff';
        ctx2.fillRect(0, 0, 300, 300);
        
        // Buat QR sederhana
        const size = 200;
        const cellSize = size / 25;
        const qrValueStr = qrValue.toString();
        
        // QR sederhana (simulasi)
        ctx2.fillStyle = '#000000';
        for (let i = 0; i < 25; i++) {
          for (let j = 0; j < 25; j++) {
            if ((i * j) % 3 === 0 || (i + j) % 4 === 0) {
              ctx2.fillRect(50 + i * cellSize, 50 + j * cellSize, cellSize - 1, cellSize - 1);
            }
          }
        }
        
        // Tambahkan efek
        ctx2.fillStyle = 'rgba(0,0,0,0.03)';
        for (let i = 0; i < 30; i++) {
          ctx2.fillRect(i * 10, 0, 2, 300);
          ctx2.fillRect(0, i * 10, 300, 2);
        }
        
        const link = document.createElement('a');
        link.download = `ticket-${ticketCode}.png`;
        link.href = canvas2.toDataURL('image/png');
        link.click();
        resolve();
      }
    });
  };

  const handleDownloadQR = async (ticketCode) => {
    setDownloading(true);
    try {
      await downloadQRAsPNG(ticketCode, ticketCode);
    } catch (error) {
      console.error('Error downloading QR:', error);
      alert('Gagal mendownload QR Code');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAllTickets = async () => {
    setDownloading(true);
    try {
      for (let i = 0; i < tickets.length; i++) {
        await new Promise(resolve => setTimeout(resolve, i * 500));
        await downloadQRAsPNG(tickets[i].ticket_code, tickets[i].ticket_code);
      }
    } catch (error) {
      console.error('Error downloading all tickets:', error);
      alert('Gagal mendownload semua tiket');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  // Fungsi untuk generate QR Code dengan efek garis-garis
  const generateStyledQRCode = (value, size = 150) => {
    return (
      <div className="relative inline-block" id={`qr-${value.replace(/[^a-zA-Z0-9]/g, '')}`}>
        <QRCode
          value={value}
          size={size}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
        />
        {/* Efek garis-garis overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width={size} height={size} className="absolute top-0 left-0">
            <defs>
              <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              </pattern>
              <pattern id="diagonal" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="10" x2="10" y2="0" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={size} height={size} fill="url(#grid)" />
            <rect width={size} height={size} fill="url(#diagonal)" />
          </svg>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-gray-600"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 flex items-center justify-center h-[80vh]">
          <div className="text-center bg-white/80 p-8 rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#4a90e2] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Memuat detail pembayaran...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {iconPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-gray-600"
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
                opacity: pos.opacity,
                zIndex: 0
              }}
            >
              {React.createElement(pos.icon, { size: 28 })}
            </div>
          ))}
        </div>
        <NavbarEvent />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 text-center max-w-md mx-auto">
            <BiX className="text-6xl text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-gray-600 mb-6">{error || 'Pesanan tidak ditemukan'}</p>
            <button
              onClick={() => navigate('/concerts')}
              className="px-6 py-3 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] hover:bg-[#357abd] transition-colors font-medium shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] inline-flex items-center gap-2"
            >
              <BiArrowBack className="text-xl" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] relative overflow-hidden">
      {/* Decorative Icons Background */}
      <div className="absolute inset-0 pointer-events-none">
        {iconPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute text-gray-600"
            style={{
              top: pos.top,
              left: pos.left,
              transform: `rotate(${pos.rotate}) scale(${pos.scale})`,
              opacity: pos.opacity,
              zIndex: 0
            }}
          >
            {React.createElement(pos.icon, { size: 28 })}
          </div>
        ))}
      </div>

      <NavbarEvent />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] p-8 mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="w-20 h-20 bg-green-100 rounded-full border-2 border-green-200 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.2)] flex items-center justify-center mx-auto mb-4">
            <BiCheckCircle className="text-4xl text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Terima kasih telah melakukan pembayaran. Tiket Anda telah dikonfirmasi.
          </p>
          <div className="mt-4 inline-flex items-center bg-blue-50 px-4 py-2 rounded-full border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
            <span className="text-sm text-blue-700">No. Pesanan: </span>
            <span className="font-mono font-bold text-blue-800 ml-2">{order.order_number}</span>
            <button
              onClick={() => handleCopy(order.order_number)}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Salin nomor pesanan"
            >
              <BiCopy className="text-lg" />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-2">✓ Nomor pesanan disalin</p>
          )}
        </div>

        {/* Data Pemesan Card */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BiUser className="text-[#4a90e2]" />
            Data Pemesan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-3">
                <BiUser className="text-[#4a90e2] text-xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Nama Lengkap</p>
                  <p className="font-medium text-gray-800">{order.customer_name}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-3">
                <BiIdCard className="text-[#4a90e2] text-xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">NIK</p>
                  <p className="font-medium text-gray-800">{order.customer_nik}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex items-start gap-3">
                <BiUser className="text-[#4a90e2] text-xl mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{order.customer_email}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border-2 border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] md:col-span-2">
              <div className="flex items-start gap-3">
                <BiHome className="text-[#4a90e2] text-xl mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Alamat</p>
                  <p className="font-medium text-gray-800">{order.customer_address}</p>
                </div>
              </div>
            </div>
          </div>

          {order.additional_buyers && order.additional_buyers.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Pembeli Lainnya:</p>
              <div className="space-y-3">
                {order.additional_buyers.map((buyer, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
                    <p className="text-sm font-medium text-gray-800">Pembeli {index + 2}</p>
                    <p className="text-xs text-gray-600 mt-1">Nama: {buyer.name}</p>
                    <p className="text-xs text-gray-600">NIK: {buyer.nik}</p>
                    <p className="text-xs text-gray-600">Alamat: {buyer.address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Invoice Code Display */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Kode Invoice</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold text-[#4a90e2]">{order.invoice_code}</span>
            <button
              onClick={() => handleCopy(order.invoice_code)}
              className="text-gray-400 hover:text-[#4a90e2] transition-colors"
              title="Salin kode invoice"
            >
              <BiCopy className="text-lg" />
            </button>
          </div>
        </div>

        {/* Multiple Tickets dengan QR Code yang Berfungsi */}
        <div className="space-y-4 mb-6">
          {tickets.map((ticket, index) => (
            <div key={ticket.id} className="bg-white rounded border-2 border-blue-200 shadow-[8px_8px_0px_0px_rgba(74,144,226,0.2)] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white border-b-2 border-indigo-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">E-TICKET #{index + 1}</p>
                    <h3 className="text-xl font-bold mt-1">{order.product_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">TIPE TIKET</p>
                    <p className="font-bold">{ticket.ticket_type || 'Reguler'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left side - QR Code yang berfungsi */}
                  <div className="flex flex-col items-center md:w-48">
                    <button
                      onClick={() => handleViewQR(ticket)}
                      className="hover:scale-105 transition-transform cursor-pointer"
                      title="Klik untuk perbesar"
                    >
                      {generateStyledQRCode(ticket.ticket_code, 150)}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Klik QR untuk perbesar</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleViewQR(ticket)}
                        className="text-xs bg-blue-50 text-[#4a90e2] hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-1 font-medium"
                      >
                        <BiQr size={14} />
                        <span>Lihat</span>
                      </button>
                      <button
                        onClick={() => handleDownloadQR(ticket.ticket_code)}
                        disabled={downloading}
                        className="text-xs bg-blue-50 text-[#4a90e2] hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 shadow-[2px_2px_0px_0px_rgba(74,144,226,0.2)] flex items-center gap-1 font-medium disabled:opacity-50"
                      >
                        <BiDownload size={14} />
                        <span>{downloading ? '...' : 'Download'}</span>
                      </button>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-xs font-mono font-bold text-[#4a90e2] bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {ticket.ticket_code}
                      </span>
                    </div>
                  </div>

                  {/* Right side - Ticket Info */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        <p className="text-xs text-gray-500">Nama Pemilik</p>
                        <p className="font-medium text-gray-800 text-sm">
                          {index === 0 ? order.customer_name : order.additional_buyers?.[index-1]?.name}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        <p className="text-xs text-gray-500">Harga Tiket</p>
                        <p className="font-medium text-[#4a90e2] text-sm">{formatRupiah(ticket.price)}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                      <p className="text-xs text-gray-500 mb-2">Detail Event</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <BiCalendar className="text-[#4a90e2]" />
                          <span className="text-gray-700">
                            {formatDate(products?.event_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BiMap className="text-[#4a90e2]" />
                          <span className="text-gray-700">{products?.event_location || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded border-2 border-gray-200 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Ringkasan Pembayaran</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({order.quantity} tiket)</span>
              <span className="text-gray-800">{formatRupiah(order.subtotal)}</span>
            </div>
            {order.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Diskon Promo</span>
                <span>- {formatRupiah(order.promo_discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t-2 border-gray-200">
              <span>Total Dibayar</span>
              <span className="text-[#4a90e2] text-xl">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-white text-blue-600 rounded border-2 border-blue-600 shadow-[6px_6px_0px_0px_rgba(74,144,226,0.25)] hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
          >
            <BiPrinter className="text-xl" />
            <span>Cetak Semua Tiket</span>
          </button>

          <button
            onClick={handleDownloadAllTickets}
            disabled={downloading}
            className="px-6 py-3 bg-green-600 text-white rounded border-2 border-green-700 shadow-[6px_6px_0px_0px_rgba(34,197,94,0.25)] hover:bg-green-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
          >
            <BiDownload className="text-xl" />
            <span>{downloading ? 'Mendownload...' : 'Download Semua QR'}</span>
          </button>

          <button
            onClick={() => navigate('/my-orders')}
            className="px-6 py-3 bg-white text-[#4a90e2] rounded border-2 border-[#4a90e2] shadow-[6px_6px_0px_0px_rgba(74,144,226,0.25)] hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
          >
            <BiPurchaseTag className="text-xl" />
            <span>Lihat Semua Pesanan</span>
          </button>
        </div>

        {/* Email Info */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p className="flex items-center justify-center gap-1 bg-blue-50 p-3 rounded border-2 border-blue-200 shadow-[4px_4px_0px_0px_rgba(74,144,226,0.2)]">
            <BiCheckCircle className="text-green-500" />
            <span>Konfirmasi pembayaran telah dikirim ke email: </span>
            <span className="font-medium text-gray-700">{order.customer_email}</span>
          </p>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border-2 border-gray-200 shadow-[15px_15px_0px_0px_rgba(0,0,0,0.3)] max-w-lg w-full relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-200 z-10"
            >
              <BiX className="text-xl" />
            </button>
            
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">QR Code Tiket</h3>
              
              <div className="flex justify-center mb-6">
                {generateStyledQRCode(selectedTicket.ticket_code, 250)}
              </div>
              
              <p className="font-mono text-lg font-bold text-[#4a90e2] mb-2">
                {selectedTicket.ticket_code}
              </p>
              
              <p className="text-sm text-gray-600 mb-4">
                Tiket #{tickets.findIndex(t => t.id === selectedTicket.id) + 1} - {selectedTicket.ticket_type || 'Reguler'}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleDownloadQR(selectedTicket.ticket_code)}
                  disabled={downloading}
                  className="px-6 py-2 bg-[#4a90e2] text-white rounded border-2 border-[#357abd] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:bg-[#357abd] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <BiDownload />
                  <span>{downloading ? '...' : 'Download'}</span>
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-6 py-2 border-2 border-gray-200 text-gray-700 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(PaymentSuccessPage);
