import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Share2,
  AlertCircle,
  CheckCircle2,
  Layers,
  TrendingUp,
  Boxes,
  IndianRupee,
  ShoppingBag,
  ArrowUpDown,
  X,
  Image as ImageIcon,
  Check,
  Send,
  Sparkles,
  Smartphone
} from 'lucide-react';
import CustomerSubnav from '../../components/CustomerSubnav';

export default function ProductsPage() {
  const { profile, token, notifyToast } = useOutletContext() || {};
  const location = useLocation();
  const navigate = useNavigate();

  const isSegmentationSkuRoute = location.pathname.includes('/segmentation/sku');

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_inventory_value: 0,
    in_stock_count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    categories: []
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc, price_asc, price_desc, stock_desc, sales_desc

  // Modal states
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'share' | 'delete' | null
  const [activeProduct, setActiveProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // Product Form state
  const [formData, setFormData] = useState({
    product_name: '',
    product_category: '',
    price: '',
    stock_qty: '',
    product_description: '',
    image: ''
  });

  // Share Modal state
  const [sharePhone, setSharePhone] = useState('8857808284');
  const [shareCustomMsg, setShareCustomMsg] = useState('');

  // Auto-focus ref for keyboard-first modal UX
  const firstInputRef = useRef(null);

  // Fetch products from backend API (which integrates with waba.mpocket.in)
  const fetchProducts = async (forceSync = false) => {
    if (forceSync) setSyncing(true);
    else setLoading(true);

    try {
      const authToken = token || localStorage.getItem('token');
      const url = `/api/v1/products${forceSync ? '?refresh=true' : ''}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();

      if (data.success) {
        setProducts(data.data || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (forceSync) {
          notifyToast?.('✅ eCommerce Catalog synced with waba.mpocket.in!');
        }
      } else {
        console.error('Failed to load products:', data.error);
      }
    } catch (err) {
      console.error('Network error fetching products:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProducts(false);
  }, []);

  // Keyboard navigation & modal shortcuts (Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalMode) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode]);

  // Focus first input whenever a modal opens
  useEffect(() => {
    if (modalMode && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [modalMode]);

  const closeModal = () => {
    setModalMode(null);
    setActiveProduct(null);
    setFormData({
      product_name: '',
      product_category: '',
      price: '',
      stock_qty: '',
      product_description: '',
      image: ''
    });
  };

  const openCreateModal = () => {
    setActiveProduct(null);
    setFormData({
      product_name: '',
      product_category: summary.categories[0] || 'Apparel',
      price: '',
      stock_qty: '10',
      product_description: '',
      image: ''
    });
    setModalMode('create');
  };

  const openEditModal = (product) => {
    setActiveProduct(product);
    setFormData({
      product_name: product.product_name || '',
      product_category: product.product_category || 'General',
      price: String(product.price || ''),
      stock_qty: String(product.stock_qty || '0'),
      product_description: product.product_description || '',
      image: product.image || ''
    });
    setModalMode('edit');
  };

  const openShareModal = (product) => {
    setActiveProduct(product);
    setSharePhone('8857808284');
    const storeName = profile?.store_name || 'RetailNode Store';
    setShareCustomMsg(`Hello! Check out *${product.product_name}* (SKU: ${product.sku}) available at ${storeName} for ₹${Number(product.price).toLocaleString('en-IN')}. Stock: ${product.stock_qty} left.`);
    setModalMode('share');
  };

  const openDeleteModal = (product) => {
    setActiveProduct(product);
    setModalMode('delete');
  };

  // Image file handler for base64 conversion
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Create or Update submission
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.product_name.trim() || !formData.price) {
      alert('Please fill in both Product Name and Price.');
      return;
    }

    setFormLoading(true);
    const authToken = token || localStorage.getItem('token');

    try {
      const isEdit = modalMode === 'edit';
      const endpoint = isEdit ? `/api/v1/products/${activeProduct.id}` : '/api/v1/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        notifyToast?.(isEdit ? '✅ Product updated on WhatsApp Catalog!' : '✅ Product created and pushed to WhatsApp Catalog!');
        closeModal();
        fetchProducts(true);
      } else {
        alert(data.error || 'Failed to save product on WhatsApp Catalog.');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to communicate with WABA server. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteProduct = async () => {
    if (!activeProduct) return;
    setFormLoading(true);
    const authToken = token || localStorage.getItem('token');

    try {
      const res = await fetch(`/api/v1/products/${activeProduct.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        notifyToast?.('🗑️ Product removed from WhatsApp Catalog.');
        closeModal();
        fetchProducts(true);
      } else {
        alert(data.error || 'Failed to delete product.');
      }
    } catch (err) {
      alert('Network error while deleting product.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle WhatsApp Share
  const handleSendWhatsAppShare = () => {
    if (!sharePhone || !activeProduct) return;
    const cleanPhone = sharePhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(shareCustomMsg);
    window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
    notifyToast?.(`Opening WhatsApp dispatch to +91 ${cleanPhone}`);
    closeModal();
  };

  // Copy SKU to clipboard
  const handleCopySku = (sku) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'SKU', 'Product Name', 'Category', 'Price (INR)', 'Stock Qty', 'Stock Status', 'Times Sold in POS', 'Units Sold', 'POS Revenue', 'WhatsApp Synced'];
    const rows = products.map(p => [
      p.id,
      `"${p.sku}"`,
      `"${p.product_name.replace(/"/g, '""')}"`,
      `"${p.product_category}"`,
      p.price,
      p.stock_qty,
      p.stock_status,
      p.times_sold,
      p.units_sold,
      p.total_revenue,
      'YES'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SKU_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifyToast?.('📄 SKU catalog exported to CSV successfully!');
  };

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.product_name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.product_category?.toLowerCase().includes(term) ||
        p.product_description?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.product_category === selectedCategory);
    }

    // Stock Status filter
    if (selectedStockStatus !== 'ALL') {
      result = result.filter(p => p.stock_status === selectedStockStatus);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.product_name || '').localeCompare(b.product_name || '');
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'stock_desc':
          return b.stock_qty - a.stock_qty;
        case 'sales_desc':
          return (b.units_sold || 0) - (a.units_sold || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchTerm, selectedCategory, selectedStockStatus, sortBy]);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Subnav if user navigated via Segmentation SKU */}
      {isSegmentationSkuRoute && (
        <CustomerSubnav />
      )}

      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package style={{ width: '24px', height: '24px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Products &amp; SKU Catalog
                </h1>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe'
                }}>
                  eCommerce Connected
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '3px 0 0' }}>
                Integrated live with <b>waba.mpocket.in</b> WhatsApp Catalog. Track SKUs, stock levels, and POS digital bill sales.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchProducts(true)}
            disabled={syncing}
            title="Sync products live from waba.mpocket.in catalog"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: '700',
              cursor: syncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw style={{ width: '15px', height: '15px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{syncing ? 'Syncing Catalog...' : 'Sync Catalog'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={products.length === 0}
            title="Download CSV report of all SKUs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: '700',
              cursor: products.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            <span>Export CSV</span>
          </button>

          <a
            href="https://waba.mpocket.in"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#475569',
              fontSize: '0.825rem',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <span>WABA Portal</span>
            <ExternalLink style={{ width: '13px', height: '13px' }} />
          </a>

          <button
            onClick={openCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Products */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total SKUs Listed
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Boxes style={{ width: '17px', height: '17px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a' }}>
            {summary.total_products}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Synced on WhatsApp eCom</span>
          </div>
        </div>

        {/* In Stock */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Stock Items
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: '17px', height: '17px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#166534' }}>
            {summary.in_stock_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Ready for instant sale &amp; order
          </div>
        </div>

        {/* Low / Out of Stock */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Low / Out of Stock
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle style={{ width: '17px', height: '17px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: (summary.low_stock_count + summary.out_of_stock_count) > 0 ? '#b91c1c' : '#0f172a' }}>
            {summary.low_stock_count + summary.out_of_stock_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: '600', marginTop: '4px' }}>
            {summary.low_stock_count} low stock &bull; {summary.out_of_stock_count} out of stock
          </div>
        </div>

        {/* Inventory Value */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.15rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Stock Valuation
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee style={{ width: '17px', height: '17px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a' }}>
            ₹{Number(summary.total_inventory_value || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Across {summary.categories?.length || 0} catalog categories
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          minWidth: '240px'
        }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#94a3b8'
          }} />
          <input
            type="text"
            placeholder="Search by SKU, product name, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8'
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.825rem',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories ({products.length})</option>
            {summary.categories?.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({products.filter(p => p.product_category === cat).length})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Stock Status:</label>
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.825rem',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt;3 units)</option>
            <option value="low_stock">Low Stock (1-3 units)</option>
            <option value="out_of_stock">Out of Stock (0 units)</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown style={{ width: '14px', height: '14px', color: '#64748b' }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.825rem',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="name_asc">Name: A to Z</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_desc">Stock: High to Low</option>
            <option value="sales_desc">POS Sales: Most Popular</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS DATA TABLE */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {loading ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <RefreshCw style={{ width: '28px', height: '28px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Loading eCommerce Products...</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Fetching catalog items from waba.mpocket.in</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Package style={{ width: '48px', height: '48px', color: '#cbd5e1', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>No Products Found</div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px', margin: '6px auto 18px' }}>
              {searchTerm || selectedCategory !== 'ALL' || selectedStockStatus !== 'ALL'
                ? 'No items matched your current filter criteria. Try clearing filters or search terms.'
                : 'Your WhatsApp eCommerce catalog does not have any active products yet. Add your first item!'}
            </p>
            {(searchTerm || selectedCategory !== 'ALL' || selectedStockStatus !== 'ALL') ? (
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); setSelectedStockStatus('ALL'); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={openCreateModal}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Add First Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.835rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 16px', width: '56px' }}>Item</th>
                  <th style={{ padding: '12px 16px' }}>SKU Code</th>
                  <th style={{ padding: '12px 16px' }}>Product Name</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock Qty</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>POS Sales</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>eCom Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isLow = p.stock_status === 'low_stock';
                  const isOut = p.stock_status === 'out_of_stock';
                  const stockBadgeBg = isOut ? '#fee2e2' : (isLow ? '#fef3c7' : '#dcfce7');
                  const stockBadgeColor = isOut ? '#991b1b' : (isLow ? '#92400e' : '#166534');

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Image Thumbnail */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.product_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <ImageIcon style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
                          )}
                        </div>
                      </td>

                      {/* SKU Code */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: '700',
                            fontSize: '0.78rem',
                            color: '#1e293b',
                            backgroundColor: '#f1f5f9',
                            padding: '3px 6px',
                            borderRadius: '5px'
                          }}>
                            {p.sku}
                          </span>
                          <button
                            onClick={() => handleCopySku(p.sku)}
                            title="Copy SKU"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px',
                              color: copiedSku === p.sku ? '#16a34a' : '#94a3b8'
                            }}
                          >
                            {copiedSku === p.sku ? (
                              <Check style={{ width: '13px', height: '13px' }} />
                            ) : (
                              <span style={{ fontSize: '0.7rem' }}>📋</span>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Product Name & Description */}
                      <td style={{ padding: '10px 16px', maxWidth: '240px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.product_name}
                        </div>
                        {p.product_description && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                            {p.product_description}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                          whiteSpace: 'nowrap'
                        }}>
                          {p.product_category}
                        </span>
                      </td>

                      {/* Price & Value */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                          Val: ₹{Math.round(p.price * p.stock_qty).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: stockBadgeBg,
                          color: stockBadgeColor
                        }}>
                          {p.stock_qty} {isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock')}
                        </span>
                      </td>

                      {/* POS Sales Metrics */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {p.units_sold > 0 ? (
                          <div>
                            <div style={{ fontWeight: '700', color: '#166534', fontSize: '0.8rem' }}>
                              {p.units_sold} units
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              ₹{p.total_revenue.toLocaleString('en-IN')} ({p.times_sold} bills)
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No POS bills</span>
                        )}
                      </td>

                      {/* eCommerce Sync Status */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                          <span>Active</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openShareModal(p)}
                            title="Share on WhatsApp"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              cursor: 'pointer'
                            }}
                          >
                            <Share2 style={{ width: '14px', height: '14px' }} />
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 style={{ width: '14px', height: '14px' }} />
                          </button>

                          <button
                            onClick={() => openDeleteModal(p)}
                            title="Delete Product"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              backgroundColor: '#fff1f2',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {!loading && filteredProducts.length > 0 && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <div>
              Showing <b>{filteredProducts.length}</b> of <b>{products.length}</b> products from <b>waba.mpocket.in</b>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Catalog Sync: Connected &amp; Real-time</span>
            </div>
          </div>
        )}
      </div>

      {/* CREATE & EDIT MODAL */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                  {modalMode === 'create' ? 'Add New SKU / Product' : `Edit Product: ${activeProduct?.product_name}`}
                </h3>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  required
                  placeholder="e.g. Silk Kanjivaram Saree or Marble Ganesha Idol"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apparel, Idols, Sweets"
                    value={formData.product_category}
                    onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 1499"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Stock Available (Units)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ width: '100%', fontSize: '0.78rem', padding: '6px 0' }}
                  />
                </div>
              </div>

              {formData.image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={formData.image} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>✓ Image loaded for WhatsApp Catalog</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Product Description (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Short description displayed on WhatsApp customer catalog..."
                  value={formData.product_description}
                  onChange={(e) => setFormData({ ...formData, product_description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.825rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {formLoading && <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
                  <span>{modalMode === 'create' ? 'Push to WhatsApp Catalog' : 'Update Catalog Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARE MODAL */}
      {modalMode === 'share' && activeProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f0fdf4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 style={{ width: '18px', height: '18px', color: '#16a34a' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#166534' }}>
                  Share Product via WhatsApp
                </h3>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Customer WhatsApp Number *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '9px 10px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#475569'
                  }}>
                    +91
                  </span>
                  <input
                    ref={firstInputRef}
                    type="tel"
                    required
                    placeholder="e.g. 8857808284"
                    value={sharePhone}
                    onChange={(e) => setSharePhone(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '0 8px 8px 0', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  WhatsApp Message Preview
                </label>
                <textarea
                  rows="4"
                  value={shareCustomMsg}
                  onChange={(e) => setShareCustomMsg(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.83rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppShare}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send style={{ width: '14px', height: '14px' }} />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modalMode === 'delete' && activeProduct && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #fee2e2',
            overflow: 'hidden',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Trash2 style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
              Remove Product from Catalog?
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 1.25rem' }}>
              Are you sure you want to remove <b>{activeProduct.product_name}</b> (SKU: {activeProduct.sku}) from the WhatsApp eCommerce Catalog? This cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Keep Product
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={formLoading}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.825rem',
                  fontWeight: '700',
                  cursor: formLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {formLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
