const axios = require('axios');
const db = require('../config/database');
const redis = require('../config/redis');
const FormData = require('form-data');
const { getWabaCredentials } = require('../services/wabaClient');

const WABA_BASE_URL = process.env.WABA_BASE_URL || 'https://waba.mpocket.in';

/**
 * GET /api/v1/products
 * Retrieves all eCommerce products/SKUs from WABA setup and correlates with invoice sales
 */
exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const cacheKey = `products:list:${tenantId}`;

    const forceRefresh = req.query.refresh === 'true' || req.query.sync === 'true';

    // 1. Check Redis Cache (unless force refresh requested)
    if (!forceRefresh) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }
      } catch (e) {}
    }

    // 2. Fetch WABA credentials
    const creds = await getWabaCredentials(tenantId);
    const token = creds.accessToken || process.env.DEFAULT_WABA_ACCESS_TOKEN || 'Vpv6mesdUaY3XHS6BKrM0XOdIoQu4ygTVaHmpKMNb29bc1c7';

    // 3. Fetch products from waba.mpocket.in
    let rawProducts = [];
    try {
      const wabaRes = await axios.get(`${WABA_BASE_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      rawProducts = Array.isArray(wabaRes.data) ? wabaRes.data : [];
    } catch (wabaErr) {
      console.warn('[ProductController] Failed to fetch products from WABA:', wabaErr.message);
      rawProducts = [];
    }

    // 4. Fetch store invoices to aggregate SKU sales performance
    let skuSalesMap = {};
    try {
      const [invoiceRows] = await db.query(
        `SELECT receipt_data, bill_amount FROM invoices WHERE tenant_id = ? ORDER BY id DESC LIMIT 500`,
        [tenantId]
      );

      invoiceRows.forEach(inv => {
        let items = [];
        try {
          const parsed = typeof inv.receipt_data === 'string' ? JSON.parse(inv.receipt_data) : inv.receipt_data;
          items = parsed?.Items || parsed?.items || [];
        } catch (e) {}

        if (Array.isArray(items)) {
          items.forEach(it => {
            const nameKey = (it.name || it.item_name || it.title || '').trim().toLowerCase();
            if (!nameKey) return;

            if (!skuSalesMap[nameKey]) {
              skuSalesMap[nameKey] = { times_sold: 0, units_sold: 0, total_revenue: 0 };
            }

            const qty = parseFloat(it.qty || it.quantity || 1) || 1;
            const rate = parseFloat(it.rate || it.price || it.amount || 0) || 0;
            const amt = parseFloat(it.amount || it.total || (qty * rate)) || 0;

            skuSalesMap[nameKey].times_sold += 1;
            skuSalesMap[nameKey].units_sold += qty;
            skuSalesMap[nameKey].total_revenue += amt;
          });
        }
      });
    } catch (dbErr) {
      console.warn('[ProductController] Failed to aggregate invoice items:', dbErr.message);
    }

    // 5. Enrich products with SKU, sales metrics, and stock status
    const categoriesSet = new Set();
    let totalInventoryValue = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const products = rawProducts.map(p => {
      const pName = (p.product_name || '').trim();
      const pNameLower = pName.toLowerCase();
      const priceNum = parseFloat(p.price || 0) || 0;
      const stockNum = parseInt(p.stock_qty || 0, 10) || 0;
      const category = (p.product_category || 'General').trim();

      categoriesSet.add(category);
      totalInventoryValue += (priceNum * stockNum);

      let stockStatus = 'in_stock';
      if (stockNum <= 0) {
        stockStatus = 'out_of_stock';
        outOfStockCount++;
      } else if (stockNum <= 3) {
        stockStatus = 'low_stock';
        lowStockCount++;
      } else {
        inStockCount++;
      }

      // Correlate with sales metrics
      const sales = skuSalesMap[pNameLower] || { times_sold: 0, units_sold: 0, total_revenue: 0 };

      // Image URL formatting
      let imageUrl = null;
      if (p.image) {
        if (p.image.startsWith('http')) {
          imageUrl = p.image;
        } else if (p.image.startsWith('uploads/')) {
          imageUrl = `${WABA_BASE_URL}/${p.image}`;
        } else if (p.image.length > 100) {
          imageUrl = `data:image/jpeg;base64,${p.image}`;
        }
      }

      return {
        id: p.id,
        sku: p.gtin || `SKU-${String(p.id).padStart(4, '0')}`,
        product_name: pName,
        product_description: p.product_description || '',
        product_category: category,
        price: priceNum,
        sale_price: p.sale_price ? parseFloat(p.sale_price) : null,
        stock_qty: stockNum,
        stock_status: stockStatus,
        availability: p.availability || (stockNum > 0 ? 'in stock' : 'out of stock'),
        condition: p.condition || 'new',
        image: imageUrl,
        raw_image: p.image,
        brand: p.brand || null,
        gtin: p.gtin || null,
        times_sold: sales.times_sold,
        units_sold: sales.units_sold,
        total_revenue: Math.round(sales.total_revenue),
        whatsapp_synced: true,
        created_at: p.created_at || null
      };
    });

    const responseData = {
      success: true,
      summary: {
        total_products: products.length,
        total_inventory_value: Math.round(totalInventoryValue),
        in_stock_count: inStockCount,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        categories: Array.from(categoriesSet)
      },
      data: products
    };

    // Cache in Redis for 60 seconds
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 60);
    } catch (e) {}

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve products' });
  }
};

/**
 * POST /api/v1/products
 * Creates a new product on WABA eCommerce catalog
 */
exports.createProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { product_name, product_category, price, stock_qty, product_description, image } = req.body;

    if (!product_name || !price) {
      return res.status(400).json({ success: false, error: 'Product name and price are required' });
    }

    const creds = await getWabaCredentials(tenantId);
    const token = creds.accessToken || process.env.DEFAULT_WABA_ACCESS_TOKEN || 'Vpv6mesdUaY3XHS6BKrM0XOdIoQu4ygTVaHmpKMNb29bc1c7';

    // Use multipart/form-data for WABA API compatibility
    const form = new FormData();
    form.append('product_name', String(product_name).trim());
    form.append('product_category', String(product_category || 'General').trim());
    form.append('price', String(price));
    form.append('stock_qty', String(stock_qty || 0));
    form.append('product_description', String(product_description || '').trim());

    if (image && typeof image === 'string' && image.startsWith('data:image')) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      form.append('image', buffer, { filename: 'product.jpg', contentType: 'image/jpeg' });
    }

    const wabaRes = await axios.post(`${WABA_BASE_URL}/api/products`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      },
      timeout: 15000
    });

    // Invalidate Redis cache
    try {
      await redis.del(`products:list:${tenantId}`);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Product added successfully to WhatsApp eCommerce Catalog!',
      product_id: wabaRes.data?.product_id
    });
  } catch (error) {
    console.error('Error creating product:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create product'
    });
  }
};

/**
 * PUT /api/v1/products/:id
 * Updates an existing product on WABA eCommerce catalog
 */
exports.updateProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { product_name, product_category, price, stock_qty, product_description, image } = req.body;

    const creds = await getWabaCredentials(tenantId);
    const token = creds.accessToken || process.env.DEFAULT_WABA_ACCESS_TOKEN || 'Vpv6mesdUaY3XHS6BKrM0XOdIoQu4ygTVaHmpKMNb29bc1c7';

    const form = new FormData();
    if (product_name) form.append('product_name', String(product_name).trim());
    if (product_category) form.append('product_category', String(product_category).trim());
    if (price !== undefined) form.append('price', String(price));
    if (stock_qty !== undefined) form.append('stock_qty', String(stock_qty));
    if (product_description !== undefined) form.append('product_description', String(product_description).trim());

    if (image && typeof image === 'string' && image.startsWith('data:image')) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      form.append('image', buffer, { filename: 'product_update.jpg', contentType: 'image/jpeg' });
    }

    await axios.put(`${WABA_BASE_URL}/api/products/${id}`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      },
      timeout: 15000
    });

    try {
      await redis.del(`products:list:${tenantId}`);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Product updated successfully in WhatsApp eCommerce Catalog!'
    });
  } catch (error) {
    console.error('Error updating product:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update product'
    });
  }
};

/**
 * DELETE /api/v1/products/:id
 * Deletes a product from WABA eCommerce catalog
 */
exports.deleteProduct = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const creds = await getWabaCredentials(tenantId);
    const token = creds.accessToken || process.env.DEFAULT_WABA_ACCESS_TOKEN || 'Vpv6mesdUaY3XHS6BKrM0XOdIoQu4ygTVaHmpKMNb29bc1c7';

    await axios.delete(`${WABA_BASE_URL}/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    try {
      await redis.del(`products:list:${tenantId}`);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Product removed from eCommerce catalog'
    });
  } catch (error) {
    console.error('Error deleting product:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete product'
    });
  }
};
