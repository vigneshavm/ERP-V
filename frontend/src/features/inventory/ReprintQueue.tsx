import { Link } from 'react-router-dom';
import SqlOperationPanel from '../../components/shared/SqlOperationPanel';

export default function ReprintQueue() {
  return <main className="p-6 space-y-5 text-main">
    <h1 className="text-2xl font-bold">Barcode / Label Reprint</h1>
    <p>Find RC GRN or Reference GRN records and generate salesman sticker files here. Persistent product reprint queues and queue clearing remain unavailable because their existing SQL lifecycle is not verified.</p>
    <Link className="underline" to="/inventory/barcodes">Barcode details and cancellation check</Link>
    <SqlOperationPanel title="GRN lookup and salesman stickers" allowedOperations={['rc-grn', 'ref-grn', 'salesmen']} />
  </main>;
}
