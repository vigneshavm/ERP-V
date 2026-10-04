import { Link } from 'react-router-dom';
import SqlOperationPanel from '../../components/shared/SqlOperationPanel';

export default function BarcodeManager() {
  return <main className="p-6 space-y-5 text-main">
    <h1 className="text-2xl font-bold">Barcodes</h1>
    <Link className="underline" to="/inventory/reprint">Label reprint and salesman stickers</Link>
    <SqlOperationPanel title="Barcode and GRN details" allowedOperations={['rc-grn', 'ref-grn', 'barcode-cancel']} />
  </main>;
}
