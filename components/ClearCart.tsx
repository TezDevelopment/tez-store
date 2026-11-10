'use client';
import { useEffect } from 'react';

export default function ClearCart() {
  useEffect(() => { try { localStorage.removeItem('tez-cart-v1'); } catch {} }, []);
  return null;
}
