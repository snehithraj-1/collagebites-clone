/**
 * Excel / CSV Export Utility for CampusBites Admin
 * Formats orders data into Excel-compatible CSV with UTF-8 BOM,
 * ensuring proper parsing of Indian phone numbers, item lists, and dates.
 */

export function exportOrdersToExcel(orders, {
  timeframe = 'ALL', // 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'
  startDate = null,
  endDate = null,
  restaurantName = 'All Restaurants'
} = {}) {
  if (!Array.isArray(orders) || orders.length === 0) {
    alert('No orders available to export for the selected filter.');
    return;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Filter orders by timeframe
  const filtered = orders.filter((order) => {
    if (!order.created_at) return true;
    const orderDate = new Date(order.created_at);

    if (timeframe === 'TODAY') {
      return orderDate >= startOfDay;
    }

    if (timeframe === 'THIS_WEEK') {
      const dayOfWeek = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      return orderDate >= startOfWeek;
    }

    if (timeframe === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return orderDate >= startOfMonth;
    }

    if (timeframe === 'CUSTOM' && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    }

    return true; // 'ALL'
  });

  if (filtered.length === 0) {
    alert(`No orders found matching the timeframe "${timeframe}".`);
    return;
  }

  // Headers required by Part 9:
  // Order ID, Student Name, Phone Number, Email, Restaurant Name, Ordered Items, Quantity, Total Amount, Order Status, Date, Time
  const headers = [
    'Order ID',
    'Student Name',
    'Phone Number',
    'Email Address',
    'Restaurant Name',
    'Ordered Items',
    'Total Quantity',
    'Total Amount (INR)',
    'Order Status',
    'Date',
    'Time'
  ];

  const rows = filtered.map((order) => {
    const rawItems = order.items || order.order_items || [];
    let itemsArr = [];
    if (typeof rawItems === 'string') {
      try { itemsArr = JSON.parse(rawItems); } catch { itemsArr = []; }
    } else if (Array.isArray(rawItems)) {
      itemsArr = rawItems;
    }

    // Format items: "Chicken Dum Biryani (Single) x 2; Veg Manchurian x 1"
    const itemsDescription = itemsArr.map(i => `${i.name || 'Item'} x ${i.quantity || 1}`).join('; ');
    const totalQty = itemsArr.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    const d = order.created_at ? new Date(order.created_at) : new Date();
    const dateStr = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const cleanPhone = (order.student_phone || '').replace(/\D/g, '');
    // Excel formula wrap `="9989955833"` forces Excel to treat Indian phone numbers as strings without scientific notation
    const phoneFormatted = cleanPhone ? `="${cleanPhone}"` : '';

    return [
      order.id || '',
      order.student_name || 'Student',
      phoneFormatted,
      order.student_email || '',
      order.restaurant_name || restaurantName || 'Campus Kitchen',
      itemsDescription,
      totalQty,
      order.total_amount || 0,
      order.status || 'CONFIRMED',
      dateStr,
      timeStr
    ];
  });

  // Convert to CSV with RFC 4180 escaping
  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(','))
  ].join('\r\n');

  // Prefix with UTF-8 BOM (\uFEFF) so Excel opens UTF-8 characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanRestaurant = (restaurantName || 'Orders').replace(/[^a-zA-Z0-9]/g, '_');
  const dateTag = new Date().toISOString().slice(0, 10);
  const fileName = `CampusBites_${cleanRestaurant}_${timeframe}_${dateTag}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
