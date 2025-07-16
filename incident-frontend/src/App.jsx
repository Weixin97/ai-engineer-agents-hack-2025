// ===============================================
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import IncidentDetailPage from './components/IncidentDetail/IncidentDetailPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
