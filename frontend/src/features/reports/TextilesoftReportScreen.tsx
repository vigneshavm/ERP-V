import { textilesoftFeature } from '../../config/textilesoftMenu';
import SqlRecordReport from '../../components/shared/SqlRecordReport';
import MissingSalesReport from './sales/MissingSalesReport';
export default function TextilesoftReportScreen({featureId}:{featureId:string}) {
  const feature=textilesoftFeature(featureId);
  if(!feature||feature.section!=='Report') return <p role="alert">Unknown report.</p>;
  if(feature.title==='Missing Sales') return <MissingSalesReport/>;
  return <main className="w-full min-w-0 max-w-full px-2 py-4 space-y-4 text-main"><h1 className="text-2xl font-bold">Report → {feature.group?`${feature.group} → `:''}{feature.title}</h1>
    {feature.report?<SqlRecordReport key={feature.id} report={feature.report} title={feature.title}/>:<p role="alert">Supplier Wise sales is unavailable until a unique sale-line to purchase-lot and supplier attribution has been verified. No sales are attributed using names or guessed joins.</p>}
  </main>;
}
