/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import PlantIndex from './pages/PlantIndex';
import Profile from './pages/Profile';
import AddPlant from './pages/AddPlant';
import Harvests from './pages/Harvests';
import Login from './pages/Login';
import { useStore } from './store/useStore';

export default function App() {
  const { currentUser, initializeFromDB } = useStore();

  useEffect(() => {
    if (currentUser) {
      initializeFromDB();
    }
  }, [currentUser, initializeFromDB]);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="plants" element={<PlantIndex />} />
          <Route path="harvests" element={<Harvests />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/add" element={<AddPlant />} />
      </Routes>
    </BrowserRouter>
  );
}
