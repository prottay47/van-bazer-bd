'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1920778405466258';

export default function MetaPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch pixel ID from settings API (admin panel changes take effect immediately)
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const id =
          data?.pixelId && data.pixelId !== '123456789012345'
            ? data.pixelId
            : META_PIXEL_ID;
        setPixelId(id);
      })
      .catch(() => {
        setPixelId(META_PIXEL_ID);
      });
  }, []);

  useEffect(() => {
    if (!pixelId) return;

    // Dynamically inject Meta Pixel script with the correct ID
    const existingScript = document.getElementById('fb-pixel-script');
    if (existingScript) existingScript.remove();

    // Initialize fbq base function
    if (!window.fbq) {
      const n: any = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      window.fbq = n;
      window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
    }

    // Load fbevents.js
    const script = document.createElement('script');
    script.id = 'fb-pixel-script';
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onload = () => {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    };
    document.head.appendChild(script);
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt="meta pixel"
      />
    </noscript>
  );
}

export function trackMetaPurchase(totalValue: number, orderId: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: totalValue,
      currency: 'BDT',
      content_name: 'Van Bazer BD Order',
      order_id: orderId,
    });
  }
}
