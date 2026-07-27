import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS = {
  dhakaDelivery: 70,
  subDhakaDelivery: 100,
  outsideDelivery: 130,
  pixelId: '123456789012345',
  phoneNumber: '01797-939935',
  whatsappNumber: '01797-939935',
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading settings.json:', e);
  }
  return DEFAULT_SETTINGS;
}

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
    }

    const body = await req.json();
    const current = getSettings();

    const updated = {
      ...current,
      dhakaDelivery: Number(body.dhakaDelivery) || 70,
      subDhakaDelivery: Number(body.subDhakaDelivery) || 100,
      outsideDelivery: Number(body.outsideDelivery) || 130,
      pixelId: body.pixelId !== undefined ? String(body.pixelId) : current.pixelId,
      phoneNumber: body.phoneNumber !== undefined ? String(body.phoneNumber).trim() : current.phoneNumber,
      whatsappNumber: body.whatsappNumber !== undefined ? String(body.whatsappNumber).trim() : current.whatsappNumber,
    };

    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',
      settings: updated,
    });
  } catch (error: any) {
    console.error('Save Settings Error:', error);
    return NextResponse.json(
      { error: 'সেটিংস সেভ করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
