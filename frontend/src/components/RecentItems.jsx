import { useEffect, useState } from "react";

function RecentItems({ onBrowse }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH RECENT ITEMS
  // ==========================================

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const fetchRecentItems = async () => {
    try {
      const response = await fetch(
        "https://campus-find-peach.vercel.app/api/items"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch recent items"
        );
      }

      const data = await response.json();

      // Show only the 3 newest reports
      setItems(data.slice(0, 3));
    } catch (error) {
      console.error(
        "Error fetching recent items:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="recent">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="recent-heading">

        <div>

          <p>
            RECENT REPORTS
          </p>

          <h2>
            Recently reported items
          </h2>

        </div>

        <button
          className="view-btn"
          onClick={onBrowse}
        >
          View All →
        </button>

      </div>


      {/* ==========================================
          LOADING
      ========================================== */}

      {loading ? (

        <div className="empty-box">

          <div>
            🔄
          </div>

          <h3>
            Loading recent reports...
          </h3>

          <p>
            Please wait while we load the
            latest reports.
          </p>

        </div>

      ) : items.length === 0 ? (

        /* ==========================================
           NO ITEMS
        ========================================== */

        <div className="empty-box">

          <div>
            📦
          </div>

          <h3>
            No items reported yet
          </h3>

          <p>
            Be the first to report a lost
            or found item.
          </p>

        </div>

      ) : (

        /* ==========================================
           RECENT ITEMS GRID
        ========================================== */

        <div className="recent-grid">

          {items.map((item) => (

            <div
              className="recent-card"
              key={item._id}
            >

              {/* ==========================================
                  IMAGE
              ========================================== */}

              {item.image ? (

                <img
                  src={`https://campus-find-peach.vercel.app${item.image}`}
                  alt={item.itemName}
                  className="recent-image"
                />

              ) : (

                <div className="recent-no-image">
                  📦
                </div>

              )}


              {/* ==========================================
                  DETAILS
              ========================================== */}

              <div className="recent-content">

                {/* Lost / Found + Resolved badges */}

                <div className="item-badges">

                  <span
                    className={
                      item.type === "Lost"
                        ? "item-type lost"
                        : "item-type found"
                    }
                  >
                    {item.type}
                  </span>


                  {item.status === "Resolved" && (
                    <span className="resolved-badge">
                      ✓ Resolved
                    </span>
                  )}

                </div>


                {/* Item Name */}

                <h3>
                  {item.itemName}
                </h3>


                {/* Location */}

                {item.location && (
                  <p>
                    📍 {item.location}
                  </p>
                )}


                {/* Category */}

                <p>
                  {item.category}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}

export default RecentItems;
