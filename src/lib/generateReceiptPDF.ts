import jsPDF from 'jspdf';

export interface ReceiptData {
  applicationNumber: string;
  amount?: string | null;
  currency?: string;
  method?: 'online' | 'bank_transfer' | 'whatsapp';
  customerName?: string | null;
  issuedAt?: Date;
}

const METHOD_LABELS: Record<string, string> = {
  online: 'Online Payment',
  bank_transfer: 'Bank Transfer',
  whatsapp: 'WhatsApp Order',
};

/**
 * Builds a simple, latin-script payment receipt.
 * Returns true when the file was generated and handed to the browser.
 */
export function generateReceiptPDF(data: ReceiptData): boolean {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const issued = data.issuedAt ?? new Date();
    const left = 20;
    let y = 24;

    doc.setFontSize(18);
    doc.text('Payment Receipt', left, y);
    y += 8;
    doc.setFontSize(11);
    doc.text('ATILAT RAHLA TAKUM - Travel & Tourism Agency', left, y);
    y += 6;
    doc.text('visafaster.com', left, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(left, y, 190, y);
    y += 12;

    const rows: [string, string][] = [
      ['Application Number', data.applicationNumber],
      ['Customer', data.customerName || '-'],
      ['Payment Method', METHOD_LABELS[data.method || 'online'] || 'Online Payment'],
      ['Amount', data.amount ? `${data.amount} ${data.currency || 'SAR'}` : '-'],
      ['Issued At', issued.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'],
    ];

    doc.setFontSize(12);
    for (const [label, value] of rows) {
      doc.setTextColor(110);
      doc.text(label, left, y);
      doc.setTextColor(20);
      doc.text(String(value), left + 60, y);
      y += 10;
    }

    y += 4;
    doc.line(left, y, 190, y);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(
      'This receipt confirms the service request recorded under the application number above.',
      left,
      y,
    );
    y += 5;
    doc.text(
      'We are a private travel agency. We do not issue visas and cannot guarantee approval.',
      left,
      y,
    );

    doc.save(`receipt-${data.applicationNumber}.pdf`);
    return true;
  } catch (e) {
    console.error('Failed to generate receipt PDF:', e);
    return false;
  }
}
