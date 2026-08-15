import { useEffect, useState } from "react";

function EmergencyAlerts({ onViewDetails }) {
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEmergencyAlerts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/items"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();

      const urgentItems = data.filter((item) => {
        const isUrgent =
          item.isUrgent === true ||
          item.isUrgent === "true" ||
          item.isUrgent === 1 ||
          item.isUrgent === "1";

        const isLost =
          item.type === "Lost";

        const isActive =
          String(item.status || "Active")
            .toLowerCase() !== "resolved";

        return (
          isUrgent &&
          isLost &&
          isActive
        );
      });

      setAlerts(urgentItems);
    } catch (error) {
      console.error(
        "Error loading emergency alerts:",
        error
      );

      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyAlerts();

    const interval = setInterval(
      fetchEmergencyAlerts,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  const hasAlerts = alerts.length > 0;

  return (
    <section className="emergency-section">

      <div className="emergency-section-inner">

        {/* ==========================================
            HOME PAGE EMERGENCY CARD
        ========================================== */}

        <div
          className={
            hasAlerts
              ? "emergency-home-card active"
              : "emergency-home-card"
          }
        >

          <div className="emergency-home-icon">
            🚨
          </div>

          <div className="emergency-home-content">

            <p>
              CAMPUS SAFETY ALERT
            </p>

            <h2>
              Emergency Lost Item Alerts
            </h2>

            <span>
              Quickly check urgent lost reports
              from around campus.
            </span>

          </div>


          <button
            className="emergency-home-btn"
            onClick={() =>
              setShowAlerts(
                !showAlerts
              )
            }
          >
            {showAlerts
              ? "Hide Alerts ↑"
              : hasAlerts
                ? `View ${alerts.length} Alert${alerts.length === 1 ? "" : "s"} →`
                : "Check Alerts →"}
          </button>

        </div>


        {/* ==========================================
            ALERTS LIST
        ========================================== */}

        {showAlerts && (

          <div className="emergency-expanded">

            {loading ? (

              <div className="emergency-empty">
                🔄 Loading emergency alerts...
              </div>

            ) : alerts.length === 0 ? (

              <div className="emergency-empty">

                <div className="emergency-empty-icon">
                  ✅
                </div>

                <h3>
                  No emergency alerts right now
                </h3>

                <p>
                  There are currently no active
                  urgent lost-item reports.
                </p>

              </div>

            ) : (

              <>

                <div className="emergency-expanded-heading">

                  <div>

                    <p>
                      ACTIVE ALERTS
                    </p>

                    <h3>
                      Urgent Lost Items
                    </h3>

                  </div>

                  <span className="emergency-count">
                    {alerts.length}
                  </span>

                </div>


                <div className="emergency-alert-list">

                  {alerts.map((item) => (

                    <div
                      className="emergency-alert-card"
                      key={item._id}
                    >

                      {/* Image */}

                      <div className="emergency-alert-image">

                        {item.image ? (

                          <img
                            src={`http://localhost:5000${item.image}`}
                            alt={item.itemName}
                          />

                        ) : (

                          <div className="emergency-no-image">
                            📦
                          </div>

                        )}

                      </div>


                      {/* Content */}

                      <div className="emergency-alert-content">

                        <div className="emergency-badge">
                          🚨 URGENT
                        </div>

                        <h3>
                          {item.itemName}
                        </h3>

                        <p>
                          {item.description}
                        </p>

                        <div className="emergency-location">
                          📍{" "}
                          {item.location ||
                            "Location not provided"}
                        </div>

                        <div className="emergency-date">
                          Reported on{" "}
                          {item.date
                            ? new Date(
                                item.date
                              ).toLocaleDateString()
                            : "Unknown date"}
                        </div>

                        <button
                          className="emergency-view-btn"
                          onClick={() =>
                            onViewDetails(item)
                          }
                        >
                          View Report →
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              </>

            )}

          </div>

        )}

      </div>

    </section>
  );
}

export default EmergencyAlerts;