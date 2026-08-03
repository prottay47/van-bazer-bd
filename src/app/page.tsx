import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import HomeClient, { type HomeSettings, type ProductDesign } from './HomeClient';

// Product/settings প্রতি request এ fresh লাগে, তাই cache করা হয় না
export const dynamic = 'force-dynamic';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: HomeSettings = {
  inside_dhaka: 70,
  sub_dhaka: 100,
  outside_dhaka: 130,
  phoneNumber: '01797-939935',
  whatsappNumber: '01797-939935',
};

async function getSettings(): Promise<HomeSettings> {
  try {
    const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return {
      inside_dhaka: Number(data.dhakaDelivery) || DEFAULT_SETTINGS.inside_dhaka,
      sub_dhaka: Number(data.subDhakaDelivery) || DEFAULT_SETTINGS.sub_dhaka,
      outside_dhaka: Number(data.outsideDelivery) || DEFAULT_SETTINGS.outside_dhaka,
      phoneNumber: data.phoneNumber || DEFAULT_SETTINGS.phoneNumber,
      whatsappNumber: data.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber,
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

async function getProducts(): Promise<ProductDesign[]> {
  try {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  } catch (e) {
    console.error('Error loading products:', e);
    return [];
  }
}

export default async function Page() {
  const [productList, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <>
      {/* প্রথম ছবিটা HTML এর সাথেই preload হয়, JS এর জন্য অপেক্ষা করে না */}
      {productList[0]?.image && (
        <link rel="preload" as="image" href={productList[0].image} {...{ fetchpriority: 'high' }} />
      )}
      <HomeClient initialProducts={productList} initialSettings={settings} />
    </>
  );
}
