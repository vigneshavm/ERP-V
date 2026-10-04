import { Link } from 'react-router-dom';
import { textilesoftFeature } from '../../config/textilesoftMenu';
import SqlRecordReport from '../../components/shared/SqlRecordReport';
import SqlOperationPanel from '../../components/shared/SqlOperationPanel';
import PurchaseReturns from './PurchaseReturns';
export default function TextilesoftPurchaseScreen({ featureId }: { featureId:string }) {
  const feature=textilesoftFeature(featureId);
  if(!feature||feature.section!=='Purchase') return <p role="alert">Unknown purchase operation.</p>;
  if(feature.title==='Purchase Return') return <PurchaseReturns/>;
  const operation=feature.title==='Salesman Sticker Print'?'salesmen':feature.title==='Barcode Cancel'?'barcode-cancel':null;
  const writeUnavailable=feature.title!=='Combo Detail' && !operation && feature.title!=='Purchase Barcode';
  return <main className="p-6 space-y-5 text-main"><h1 className="text-2xl font-bold">Purchase → {feature.group?`${feature.group} → `:''}{feature.title}</h1>
    {operation&&<SqlOperationPanel key={feature.id} title={feature.title} allowedOperations={[operation]}/>}
    {feature.title==='Purchase Barcode'&&<><SqlOperationPanel title="Purchase barcode / GRN lookup" allowedOperations={['rc-grn','ref-grn']}/><p>Purchase lot lookup is available. Purchase-label templates and physical printer acceptance are not verified; no invented barcode or price label is generated.</p></>}
    {feature.report&&<SqlRecordReport key={feature.id} title={feature.title==='Combo Detail'?'Existing combo lot details':'Current SQL lot / rate records'} report={feature.report}/>}
    {writeUnavailable&&<section><h2 className="text-lg font-bold">Save unavailable</h2><p>This operation has no verified complete SQL transaction covering the purchase lot, stock, rate history, tax and supplier effects. Existing records remain available in the register. No partial save or substitute storage is used.</p><button disabled className="rounded border px-3 py-2">Save {feature.title}</button></section>}
    <Link className="underline" to="/purchase/register">Open existing Purchase Register</Link>
  </main>;
}
