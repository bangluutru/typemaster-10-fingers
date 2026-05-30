import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting automated browser test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set window size to a typical laptop screen
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Listen for console errors during execution
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  console.log('🔗 Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/');
  
  console.log('⏳ Waiting for homepage to load...');
  await page.waitForSelector('text=Bắt đầu luyện tập');

  console.log('👆 Clicking "Bắt đầu luyện tập" button...');
  await page.click('text=Bắt đầu luyện tập');
  
  console.log('⏳ Waiting 3.5 seconds for typing practice stage to initialize, SVGs to load, and docking geometry to calculate...');
  await page.waitForTimeout(3500);
  
  const screenshotPath = 'browser_test_result.png';
  console.log('📸 Capturing screenshot...');
  await page.screenshot({ path: screenshotPath });
  console.log(`✅ Success! Screenshot captured and saved at: ${screenshotPath}`);
  
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
