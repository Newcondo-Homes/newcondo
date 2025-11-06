// apps/admin/src/lib/utils/exportToPdf.ts

/**
 * Export HTML content to PDF
 * Note: This uses the browser's print functionality
 * For more advanced PDF generation, consider using jsPDF or similar libraries
 */
export const exportToPDF = (
  elementId: string,
  filename: string = 'export'
): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }
  
  // Store original title
  const originalTitle = document.title;
  
  // Set filename as page title (used by print dialog)
  document.title = filename;
  
  // Print the element
  window.print();
  
  // Restore original title
  document.title = originalTitle;
};

/**
 * Generate PDF report with table data
 */
export const generatePDFReport = (
  title: string,
  data: Record<string, any>[],
  headers: string[],
  filename: string = 'report'
): void => {
  // Create temporary container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
    padding: 40px;
    overflow: auto;
  `;
  
  // Build HTML content
  let html = `
    <style>
      @media print {
        body { margin: 0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: 600; }
        h1 { margin-bottom: 20px; }
      }
    </style>
    <h1>${title}</h1>
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  document.body.appendChild(container);
  
  // Print
  const originalTitle = document.title;
  document.title = filename;
  window.print();
  document.title = originalTitle;
  
  // Remove container
  document.body.removeChild(container);
};

/**
 * Export chart as PDF
 */
export const exportChartToPDF = (
  chartElementId: string,
  title: string,
  filename: string = 'chart'
): void => {
  const chart = document.getElementById(chartElementId);
  if (!chart) {
    console.error(`Chart element with id "${chartElementId}" not found`);
    return;
  }
  
  // Create temporary container with chart
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  `;
  
  container.innerHTML = `
    <style>
      @media print {
        body { margin: 0; }
        h1 { margin-bottom: 20px; }
      }
    </style>
    <h1>${title}</h1>
    ${chart.outerHTML}
  `;
  
  document.body.appendChild(container);
  
  // Print
  const originalTitle = document.title;
  document.title = filename;
  window.print();
  document.title = originalTitle;
  
  // Remove container
  document.body.removeChild(container);
};

/**
 * Export analytics dashboard to PDF
 */
export const exportDashboardToPDF = (
  dashboardConfig: {
    title: string;
    sections: Array<{
      title: string;
      elementId: string;
    }>;
    filename?: string;
  }
): void => {
  const { title, sections, filename = 'dashboard' } = dashboardConfig;
  
  // Create temporary container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
    padding: 40px;
    overflow: auto;
  `;
  
  // Build HTML content
  let html = `
    <style>
      @media print {
        body { margin: 0; }
        h1 { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { margin-top: 30px; margin-bottom: 15px; }
        .section { page-break-inside: avoid; margin-bottom: 30px; }
      }
    </style>
    <h1>${title}</h1>
  `;
  
  sections.forEach(section => {
    const element = document.getElementById(section.elementId);
    if (element) {
      html += `
        <div class="section">
          <h2>${section.title}</h2>
          ${element.innerHTML}
        </div>
      `;
    }
  });
  
  container.innerHTML = html;
  document.body.appendChild(container);
  
  // Print
  const originalTitle = document.title;
  document.title = filename;
  window.print();
  document.title = originalTitle;
  
  // Remove container
  document.body.removeChild(container);
};

/**
 * Export with custom styling
 */
export const exportStyledPDF = (
  content: string,
  styles: string,
  filename: string = 'export'
): void => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 9999;
    padding: 40px;
    overflow: auto;
  `;
  
  container.innerHTML = `
    <style>
      @media print {
        body { margin: 0; }
        ${styles}
      }
    </style>
    ${content}
  `;
  
  document.body.appendChild(container);
  
  // Print
  const originalTitle = document.title;
  document.title = filename;
  window.print();
  document.title = originalTitle;
  
  // Remove container
  document.body.removeChild(container);
};

/**
 * Create printable report
 */
export const createPrintableReport = (
  reportConfig: {
    title: string;
    subtitle?: string;
    summary: Record<string, any>;
    data: Record<string, any>[];
    headers: string[];
    footer?: string;
  }
): string => {
  const { title, subtitle, summary, data, headers, footer } = reportConfig;
  
  let html = `
    <div style="font-family: system-ui, -apple-system, sans-serif;">
      <div style="margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">${title}</h1>
        ${subtitle ? `<p style="margin: 10px 0 0 0; color: #666;">${subtitle}</p>` : ''}
      </div>
      
      ${Object.keys(summary).length > 0 ? `
        <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px;">Summary</h2>
          ${Object.entries(summary).map(([key, value]) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-weight: 500;">${key}:</span>
              <span>${value}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f3f4f6;">
            ${headers.map(h => `<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, idx) => `
            <tr style="${idx % 2 === 0 ? 'background: #ffffff;' : 'background: #f9fafb;'}">
              ${headers.map(h => `<td style="padding: 12px; border: 1px solid #e5e7eb;">${row[h] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      ${footer ? `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
          ${footer}
        </div>
      ` : ''}
    </div>
  `;
  
  return html;
};