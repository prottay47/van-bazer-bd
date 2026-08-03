/**
 * পুরনো আপলোড করা ছবিগুলো এক দফায় resize করার script।
 *
 * নতুন আপলোড গুলো /api/upload এ এমনিতেই resize হয়। এই script টা শুধু
 * আগে আপলোড হওয়া বড় ছবিগুলোর জন্য, একবার চালালেই হবে।
 *
 * ফাইলের নাম অপরিবর্তিত থাকে, তাই ডাটাবেজে কোনো পরিবর্তন লাগে না।
 *
 * ব্যবহার:
 *   node scripts/resize-existing-images.js --dry-run   # কী হবে শুধু দেখাবে
 *   node scripts/resize-existing-images.js             # আসলে resize করবে
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const MAX_DIMENSION = 1000;
const WEBP_QUALITY = 78;
const WEBP_EFFORT = 5;

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const SUPPORTED = new Set(['.webp', '.jpg', '.jpeg', '.png']);

const dryRun = process.argv.includes('--dry-run');

const kb = (bytes) => (bytes / 1024).toFixed(0).padStart(5) + ' KB';

async function processFile(fileName) {
  const filePath = path.join(UPLOAD_DIR, fileName);
  const before = (await fs.promises.stat(filePath)).size;

  // ফাইলটা buffer এ পড়ে নেওয়া হয়, কারণ sharp কে সরাসরি path দিলে
  // সে ফাইলটা খুলে রাখে আর তখন একই নামে rename করা যায় না
  const input = await fs.promises.readFile(filePath);
  const meta = await sharp(input).metadata();

  // ইতিমধ্যেই ছোট থাকলে হাত দেওয়ার দরকার নেই
  if (
    meta.width &&
    meta.height &&
    meta.width <= MAX_DIMENSION &&
    meta.height <= MAX_DIMENSION
  ) {
    console.log(`  skip    ${fileName}  (${meta.width}x${meta.height}, already small)`);
    return { skipped: true, before, after: before };
  }

  const output = await sharp(input)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toBuffer();

  // resize করার পরেও যদি ফাইল বড় হয়ে যায়, তাহলে আসলটাই রেখে দেওয়া ভালো
  if (output.length >= before) {
    console.log(`  keep    ${fileName}  (resize korle boro hoye jacche)`);
    return { skipped: true, before, after: before };
  }

  const newMeta = await sharp(output).metadata();

  if (dryRun) {
    console.log(
      `  WOULD   ${fileName}  ${meta.width}x${meta.height} -> ${newMeta.width}x${newMeta.height}   ${kb(before)} -> ${kb(output.length)}`
    );
    return { skipped: false, before, after: output.length };
  }

  // temp ফাইলে লিখে rename করা হয়, যাতে লেখার মাঝপথে সার্ভার বন্ধ হলেও
  // আসল ছবিটা নষ্ট না হয়
  const tmpPath = filePath + '.tmp';
  await fs.promises.writeFile(tmpPath, output);
  await fs.promises.rename(tmpPath, filePath);

  console.log(
    `  done    ${fileName}  ${meta.width}x${meta.height} -> ${newMeta.width}x${newMeta.height}   ${kb(before)} -> ${kb(output.length)}`
  );
  return { skipped: false, before, after: output.length };
}

async function main() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.error(`Upload folder pawa jaini: ${UPLOAD_DIR}`);
    process.exit(1);
  }

  const entries = await fs.promises.readdir(UPLOAD_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && SUPPORTED.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort();

  if (files.length === 0) {
    console.log('Kono chobi pawa jaini.');
    return;
  }

  console.log(`Folder : ${UPLOAD_DIR}`);
  console.log(`Chobi  : ${files.length} ta`);
  console.log(dryRun ? 'Mode   : DRY RUN (kichu change hobe na)\n' : 'Mode   : LIVE\n');

  let totalBefore = 0;
  let totalAfter = 0;
  let changed = 0;
  let failed = 0;

  for (const fileName of files) {
    try {
      const r = await processFile(fileName);
      totalBefore += r.before;
      totalAfter += r.after;
      if (!r.skipped) changed++;
    } catch (err) {
      failed++;
      console.error(`  FAILED  ${fileName}  ${err.message}`);
    }
  }

  const savedMb = (totalBefore - totalAfter) / 1048576;
  console.log('\n----------------------------------------');
  console.log(`Resize hoyeche : ${changed} ta`);
  if (failed) console.log(`Failed         : ${failed} ta`);
  console.log(`Age            : ${(totalBefore / 1048576).toFixed(2)} MB`);
  console.log(`Ekhon          : ${(totalAfter / 1048576).toFixed(2)} MB`);
  console.log(`Bachlo         : ${savedMb.toFixed(2)} MB`);
  if (dryRun) console.log('\n(dry run chilo — kichu change hoyni)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
