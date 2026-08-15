import {
  useEffect,
  useState
} from "react";

import "./App.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Statistics from "./components/Statistics";
import EmergencyAlerts from "./components/EmergencyAlerts";
import RecentItems from "./components/RecentItems";
import ReportItem from "./components/ReportItem";
import BrowseItems from "./components/BrowseItems";
import ItemDetails from "./components/ItemDetails";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import EditItem from "./components/EditItem";


function App() {

  const [page, setPage] =
    useState("home");

  const [reportType, setReportType] =
    useState("Lost");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [loadingSharedItem, setLoadingSharedItem] =
    useState(false);


  // ==========================================
  // OPEN REPORT PAGE
  // ==========================================

  const openReportPage = (type) => {
    setReportType(type);
    setPage("report");
  };


  // ==========================================
  // OPEN ITEM DETAILS
  // ==========================================

  const openItemDetails = (item) => {

    setSelectedItem(item);

    window.history.pushState(
      {},
      "",
      `/?item=${item._id}`
    );

    setPage("details");
  };


  // ==========================================
  // CLEAR URL
  // ==========================================

  const clearUrl = () => {

    window.history.pushState(
      {},
      "",
      "/"
    );

  };


  // ==========================================
  // LOAD SHARED ITEM
  // ==========================================

  useEffect(() => {

    const itemId =
      new URLSearchParams(
        window.location.search
      ).get("item");

    if (!itemId) {
      return;
    }

    const loadSharedItem =
      async () => {

        setLoadingSharedItem(true);

        try {

          const response =
            await fetch(
              `https://campus-find-peach.vercel.app/api/items/${itemId}`
            );

          if (!response.ok) {
            throw new Error(
              "Item not found"
            );
          }

          const item =
            await response.json();

          setSelectedItem(item);
          setPage("details");

        } catch (error) {

          console.error(
            "Error loading shared item:",
            error
          );

          clearUrl();
          setPage("home");

        } finally {

          setLoadingSharedItem(false);

        }

      };

    loadSharedItem();

  }, []);


  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  const handleAdminLogin = () => {

    setIsAdmin(true);
    setPage("admin");

  };


  // ==========================================
  // ADMIN LOGOUT
  // ==========================================

  const handleAdminLogout = () => {

    setIsAdmin(false);
    setPage("home");

  };


  // ==========================================
  // EDIT PAGE
  // ==========================================

  const openEditPage = (item) => {

    setSelectedItem(item);
    setPage("edit");

  };


  // ==========================================
  // SHARED ITEM LOADING
  // ==========================================

  if (loadingSharedItem) {

    return (
      <div className="app">

        <div className="empty-box">

          <div>
            🔄
          </div>

          <h3>
            Loading shared report...
          </h3>

          <p>
            Please wait while we load
            the item details.
          </p>

        </div>

      </div>
    );

  }


  // ==========================================
  // HOME PAGE
  // ==========================================

  if (page === "home") {

    return (
      <div className="app">

        <Navbar
          onHome={() =>
            setPage("home")
          }

          onBrowse={() =>
            setPage("browse")
          }

          onReport={() =>
            openReportPage("Lost")
          }

          onAdmin={() =>
            setPage("admin-login")
          }
        />


        <Hero
          onReportLost={() =>
            openReportPage("Lost")
          }

          onReportFound={() =>
            openReportPage("Found")
          }

          onBrowse={() =>
            setPage("browse")
          }
        />


        {/* Emergency Alerts */}

        <EmergencyAlerts
          onViewDetails={
            openItemDetails
          }
        />


        <Features />


        <Statistics />


        <RecentItems
          onBrowse={() =>
            setPage("browse")
          }
        />


        <footer>

          <p>
            © 2026 CampusFind •
            Campus Lost & Found Portal
          </p>

        </footer>

      </div>
    );

  }


  // ==========================================
  // REPORT PAGE
  // ==========================================

  if (page === "report") {

    return (
      <div className="app">

        <ReportItem
          type={reportType}

          onBack={() =>
            setPage("home")
          }
        />

      </div>
    );

  }


  // ==========================================
  // BROWSE PAGE
  // ==========================================

  if (page === "browse") {

    return (
      <div className="app">

        <BrowseItems

          onBack={() => {

            clearUrl();

            setPage("home");

          }}

          onViewDetails={
            openItemDetails
          }

        />

      </div>
    );

  }


  // ==========================================
  // DETAILS PAGE
  // ==========================================

  if (page === "details") {

    return (
      <div className="app">

        <ItemDetails

          item={
            selectedItem
          }

          onBack={() => {

            clearUrl();

            setPage("browse");

          }}

        />

      </div>
    );

  }


  // ==========================================
  // ADMIN LOGIN
  // ==========================================

  if (page === "admin-login") {

    return (
      <div className="app">

        <AdminLogin

          onLogin={
            handleAdminLogin
          }

          onBack={() =>
            setPage("home")
          }

        />

      </div>
    );

  }


  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  if (page === "admin") {

    if (!isAdmin) {

      return (
        <div className="app">

          <AdminLogin

            onLogin={
              handleAdminLogin
            }

            onBack={() =>
              setPage("home")
            }

          />

        </div>
      );

    }


    return (
      <div className="app">

        <AdminDashboard

          onBack={() =>
            setPage("home")
          }

          onLogout={
            handleAdminLogout
          }

          onEdit={
            openEditPage
          }

        />

      </div>
    );

  }


  // ==========================================
  // EDIT PAGE
  // ==========================================

  if (page === "edit") {

    if (
      !isAdmin ||
      !selectedItem
    ) {

      return (
        <div className="app">

          <AdminLogin

            onLogin={
              handleAdminLogin
            }

            onBack={() =>
              setPage("home")
            }

          />

        </div>
      );

    }


    return (
      <div className="app">

        <EditItem

          item={
            selectedItem
          }

          onBack={() =>
            setPage("admin")
          }

          onUpdated={
            (updatedItem) => {

              setSelectedItem(
                updatedItem
              );

              setPage(
                "admin"
              );

            }
          }

        />

      </div>
    );

  }


  // ==========================================
  // FALLBACK
  // ==========================================

  return (
    <div className="app">

      <h2>
        Something went wrong
      </h2>

      <button
        onClick={() =>
          setPage("home")
        }
      >
        Go Back Home
      </button>

    </div>
  );
}


export default App;
