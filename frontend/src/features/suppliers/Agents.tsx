import SqlOperationPanel from '../../components/shared/SqlOperationPanel';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { getAgents } from '../../redux/slices/agentSlice';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';
import SupplierSubNav from './SupplierSubNav';

const Agents: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { agents, isLoading, isError, message } = useSelector((state: RootState) => state.agents);
  const [search, setSearch] = useState('');
  useEffect(() => { void dispatch(getAgents()); }, [dispatch]);
  const rows = useMemo(() => agents.filter(agent => agent.name.toLowerCase().includes(search.toLowerCase()) || (agent.phone ?? '').includes(search)), [agents, search]);
  return <Layout>
    <PageHeader title="Agents" />
    <SupplierSubNav />
    <section className="p-6 space-y-4 text-main">
      <p role="status">This directory shows native agent records. Registration is available below when the configured SQL writer has existing permission. Editing, deletion, supplier linkage and purchase commission remain unavailable; bill discount is shown separately.</p>
      <SqlOperationPanel title="Register agent" allowedOperations={['agent']} onSaved={() => { void dispatch(getAgents()); }} />
      <label className="block">Search name or phone <input className="ml-2 border rounded p-2 bg-surface" value={search} onChange={event => setSearch(event.target.value)} /></label>
      {isError ? <p role="alert">{message || 'Agent directory could not be loaded.'}</p> : isLoading ? <p role="status">Loading agents…</p> : <table className="w-full text-left">
        <thead><tr><th>Agent</th><th>Card number</th><th>Phone</th><th>Email</th><th>Bill discount</th></tr></thead>
        <tbody>{rows.map(agent => <tr key={agent._id}><td>{agent.name}</td><td>{agent.cardNumber || '—'}</td><td>{agent.phone || '—'}</td><td>{agent.email || '—'}</td><td>{agent.discountPercent == null ? 'Unavailable' : agent.discountPercent + '%'}</td></tr>)}</tbody>
      </table>}
      {!isError && !isLoading && rows.length === 0 && <p>No matching agent records.</p>}
    </section>
  </Layout>;
};
export default Agents;
