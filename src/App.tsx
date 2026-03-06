/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import PlantIndex from './pages/PlantIndex';
import Profile from './pages/Profile';
import AddPlant from './pages/AddPlant';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="plants" element={<PlantIndex />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/add" element={<AddPlant />} />
      </Routes>
    </BrowserRouter>
  );
}
