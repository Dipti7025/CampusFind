import { useEffect, useState } from "react";

function AdminDashboard({
  onBack,
  onLogout,
  onEdit,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(
        "https://campus-find-peach.vercel.app/api/items"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch items"
        );
      }

      const data = await response.json();

      setItems(data);
    } catch (error) {
      console.error(
        "Error fetching admin data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `https://campus-find-peach.vercel.app/api/items/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete item"
        );
      }

      setItems((currentItems) =>
        currentItems.filter(
          (item) => item._id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting item:",
        error
      );

      alert(
        "Unable to delete the item."
      );
    }
  };

  const totalReports = items.length;

  const lostItems = items.filter(
    (item) => item.type === "Lost"
  ).length;

  const foundItems = items.filter(
    (item) => item.type === "Found"
  ).length;

  const resolvedItems = items.filter(
    (item) =>
      item.status &&
      item.status.toLowerCase() ===
        "resolved"
  ).length;

  return (
    <div className="admin-page">

      <div className="admin-container">

        {/* Back Button */}
        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>


        {/* Header */}
        <div className="admin-header">

          <p className="small-title">
            CAMPUSFIND
          </p>

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Manage reported lost and found
            items.
          </p>

        </div>


        {/* Statistics */}
        <div className="admin-stats">

          <div className="admin-stat">
            <strong>
              {totalReports}
            </strong>

            <span>
              Total Reports
            </span>
          </div>


          <div className="admin-stat">
            <strong>
              {lostItems}
            </strong>

            <span>
              Lost
            </span>
          </div>


          <div className="admin-stat">
            <strong>
              {foundItems}
            </strong>

            <span>
              Found
            </span>
          </div>


          <div className="admin-stat">
            <strong>
              {resolvedItems}
            </strong>

            <span>
              Resolved
            </span>
          </div>

        </div>


        {/* Reports Table */}
        <div className="admin-table">

          <div className="admin-table-header">

            <span>
              Item
            </span>

            <span>
              Type
            </span>

            <span>
              Status
            </span>

            <span>
              Action
            </span>

          </div>


          {loading ? (

            <div className="admin-empty">
              Loading reports...
            </div>

          ) : items.length === 0 ? (

            <div className="admin-empty">
              No reports available.
            </div>

          ) : (

            items.map((item) => (

              <div
                className="admin-table-row"
                key={item._id}
              >

                <span>
                  {item.itemName}
                </span>

                <span>
                  {item.type}
                </span>

                <span
                  className={
                    item.status === "Resolved"
                      ? "admin-status resolved"
                      : "admin-status active"
                  }
                >
                  {item.status || "Active"}
                </span>


                {/* Action Buttons */}
                <div className="admin-actions">

                  <button
                    className="edit-btn"
                    onClick={() =>
                      onEdit(item)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      deleteItem(item._id)
                    }
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))

          )}

        </div>


        {/* Logout */}
        <button
          className="admin-logout-btn"
          onClick={onLogout}
        >
          Logout from Admin
        </button>

      </div>

    </div>
  );
}

export default AdminDashboard;
