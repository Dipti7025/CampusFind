import { useEffect, useState } from "react";

function Statistics() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/items"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();

      setItems(data);
    } catch (error) {
      console.error(
        "Error fetching statistics:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
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
      item.status.toLowerCase() === "resolved"
  ).length;

  return (
    <section className="statistics">

      {/* Section Heading */}
      <div className="section-heading">

        <p>
          CAMPUS ACTIVITY
        </p>

        <h2>
          Portal Statistics
        </h2>

      </div>


      {/* Statistics Cards */}
      <div className="statistics-grid">

        {/* Total Reports */}
        <div className="stat-card">

          <div className="stat-icon">
            📦
          </div>

          <h3>
            {loading ? "..." : totalReports}
          </h3>

          <p>
            Total Reports
          </p>

        </div>


        {/* Lost Items */}
        <div className="stat-card">

          <div className="stat-icon">
            🔍
          </div>

          <h3>
            {loading ? "..." : lostItems}
          </h3>

          <p>
            Lost Items
          </p>

        </div>


        {/* Found Items */}
        <div className="stat-card">

          <div className="stat-icon">
            🤝
          </div>

          <h3>
            {loading ? "..." : foundItems}
          </h3>

          <p>
            Found Items
          </p>

        </div>


        {/* Resolved Items */}
        <div className="stat-card">

          <div className="stat-icon">
            ✅
          </div>

          <h3>
            {loading ? "..." : resolvedItems}
          </h3>

          <p>
            Resolved Items
          </p>

        </div>

      </div>

    </section>
  );
}

export default Statistics;