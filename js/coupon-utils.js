/* ============================================================
   coupon-utils.js — Shared coupon logic
   Used by: cart.js, checkout.js
   ============================================================ */

const COUPONS = {
  HERB10: { type: 'percentage', value: 10, label: '10% off' }
};

function calcDiscount(subtotal, couponCode) {
  if (!couponCode) return 0;
  const coupon = COUPONS[couponCode];
  if (!coupon) return 0;
  if (coupon.type === 'percentage') return Math.round(subtotal * coupon.value / 100);
  if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal);
  return 0;
}

function calcTotals(cart, couponCode) {
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount  = calcDiscount(subtotal, couponCode);
  const discounted = subtotal - discount;
  const shipping  = discounted >= 999 ? 0 : 99;
  const tax       = Math.round(discounted * 0.05);
  const total     = discounted + shipping + tax;
  return { itemCount, subtotal, discount, shipping, tax, total };
}

/* Make available globally */
window.COUPONS    = COUPONS;
window.calcDiscount = calcDiscount;
window.calcTotals   = calcTotals;
