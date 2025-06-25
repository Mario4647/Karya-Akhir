import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Add from "./components/Add";
import Transactions from "./components/Transactions";
import Statistics from "./components/Statistics";
import Budget from "./components/Budget";
import ScrollToTop from "./components/ScrollToTop";

import Form from "./auth/Form";

function App() {
  return (
    <>
      <Routes>
        {/* Route untuk halaman login */}
        <Route path="/auth" element={<Form />} />

        {/* Route untuk halaman utama (dashboard) */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Dashboard />
              <Add />
              <Transactions />
              <Statistics />
              <Budget />
              <ScrollToTop />
            </>
          }
        />
      </Routes>
    </>
  );
}

export default App;
