const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    res.status(400).json({ error: 'Parametro URL mancante' });
    return;
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForTimeout(5000);

    const data = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('.section-result'); // da verificare selettore
      items.forEach(item => {
        const name = item.querySelector('.section-result-title')?.innerText || '';
        const address = item.querySelector('.section-result-location')?.innerText || '';
        const hours = item.querySelector('.section-result-hours')?.innerText || '';
        results.push({ name, address, hours });
      });
      return results;
    });

    await browser.close();

    // Format CSV
    let csv = 'Name,Address,Hours\n';
    data.forEach(d => {
      csv += `"${d.name.replace(/"/g, '""')}","${d.address.replace(/"/g, '""')}","${d.hours.replace(/"/g, '""')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
