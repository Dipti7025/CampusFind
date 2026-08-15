import { useEffect, useState } from "react";

function BrowseItems({ onBack, onViewDetails }) {
  const [items, setItems] = useState([]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [searchText, setSearchText] = useState("");

  const [showCategoryFilter, setShowCategoryFilter] =
    useState(false);

  const [showLocationFilter, setShowLocationFilter] =
    useState(false);

  const [sortOrder, setSortOrder] =
    useState("newest");

  const [loading, setLoading] = useState(true);


  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories = [
    "Electronics",
    "Bags",
    "Personal Items",
    "Documents / ID",
    "Keys",
    "Books / Stationery",
    "Clothing",
    "Accessories",
    "Other"
  ];


  // ==========================================
  // CAMPUS LOCATIONS
  // ==========================================

  const locations = [
    "Library",
    "Canteen",
    "Classroom",
    "Computer Lab",
    "Lab 502",
    "Lab 605",
    "Parking",
    "Auditorium",
    "Sports Ground",
    "Main Gate",
    "Other"
  ];


  // ==========================================
  // FETCH ITEMS
  // ==========================================

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
        "Error fetching items:",
        error
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {

    setTypeFilter("All");

    setCategoryFilter("All");

    setLocationFilter("All");

    setSearchText("");

    setSortOrder("newest");

  };


  // ==========================================
  // FILTER + SEARCH + SORT
  // ==========================================

  const filteredItems = items

    .filter((item) => {

      // Type
      const matchesType =
        typeFilter === "All" ||
        item.type === typeFilter;


      // Category
      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;


      // Location
      const itemLocation =
        item.location
          ?.trim()
          .toLowerCase();

      const selectedLocation =
        locationFilter
          .trim()
          .toLowerCase();

      const matchesLocation =
        locationFilter === "All" ||
        itemLocation === selectedLocation;


      // Search
      const search =
        searchText
          .toLowerCase()
          .trim();


      const matchesSearch =
        search === "" ||
        item.itemName
          ?.toLowerCase()
          .includes(search) ||
        item.description
          ?.toLowerCase()
          .includes(search) ||
        item.category
          ?.toLowerCase()
          .includes(search) ||
        item.location
          ?.toLowerCase()
          .includes(search);


      return (
        matchesType &&
        matchesCategory &&
        matchesLocation &&
        matchesSearch
      );

    })

    .sort((a, b) => {

      const dateA =
        new Date(
          a.createdAt || a.date
        ).getTime();

      const dateB =
        new Date(
          b.createdAt || b.date
        ).getTime();


      return sortOrder === "newest"
        ? dateB - dateA
        : dateA - dateB;

    });


  // ==========================================
  // RESOLVED CHECK
  // ==========================================

  const isResolved = (item) => {

    return (
      item.status &&
      item.status.toLowerCase() ===
        "resolved"
    );

  };


  return (
    <div className="browse-page">

      <div className="browse-container">


        {/* ==========================================
            BACK BUTTON
        ========================================== */}

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>


        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="browse-header">

          <div className="browse-title">

            <p className="small-title">
              CAMPUS LOST & FOUND
            </p>

            <h1>
              Browse Items
            </h1>

            <p>
              Find lost and found items reported
              by students around campus.
            </p>

          </div>


          {/* Lost / Found Buttons */}

          <div className="browse-type-buttons">

            <button
              className={
                typeFilter === "All"
                  ? "browse-type-btn active"
                  : "browse-type-btn"
              }
              onClick={() =>
                setTypeFilter("All")
              }
            >
              All
            </button>


            <button
              className={
                typeFilter === "Lost"
                  ? "browse-type-btn active lost-active"
                  : "browse-type-btn"
              }
              onClick={() =>
                setTypeFilter("Lost")
              }
            >
              Lost
            </button>


            <button
              className={
                typeFilter === "Found"
                  ? "browse-type-btn active found-active"
                  : "browse-type-btn"
              }
              onClick={() =>
                setTypeFilter("Found")
              }
            >
              Found
            </button>

          </div>

        </div>


        {/* ==========================================
            SEARCH + FILTERS
        ========================================== */}

        <div className="browse-tools">


          {/* Search */}

          <div className="search-box">

            <input
              type="text"
              placeholder="Search item name, description, category or location..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

            <span>
              🔎
            </span>

          </div>


          {/* Filters */}

          <div className="filter-section">


            {/* ==========================================
                CATEGORY FILTER
            ========================================== */}

            <div className="category-filter-wrapper">

              <button
                className={
                  categoryFilter !== "All"
                    ? "category-filter-btn selected"
                    : "category-filter-btn"
                }
                onClick={() =>
                  setShowCategoryFilter(
                    !showCategoryFilter
                  )
                }
              >

                ⚙ Filter by Category

                {categoryFilter !== "All" && (
                  <span className="filter-selected-text">
                    : {categoryFilter}
                  </span>
                )}

                <span className="filter-arrow">
                  {showCategoryFilter
                    ? "▲"
                    : "▼"}
                </span>

              </button>


              {showCategoryFilter && (

                <div className="category-filter-menu">

                  <button
                    className={
                      categoryFilter === "All"
                        ? "category-option selected-option"
                        : "category-option"
                    }
                    onClick={() => {

                      setCategoryFilter("All");

                      setShowCategoryFilter(false);

                    }}
                  >
                    All Categories
                  </button>


                  {categories.map(
                    (category) => (

                      <button
                        key={category}
                        className={
                          categoryFilter ===
                          category
                            ? "category-option selected-option"
                            : "category-option"
                        }
                        onClick={() => {

                          setCategoryFilter(
                            category
                          );

                          setShowCategoryFilter(
                            false
                          );

                        }}
                      >
                        {category}
                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ==========================================
                LOCATION FILTER
            ========================================== */}

            <div className="category-filter-wrapper">

              <button
                className={
                  locationFilter !== "All"
                    ? "category-filter-btn selected location-filter-active"
                    : "category-filter-btn"
                }
                onClick={() =>
                  setShowLocationFilter(
                    !showLocationFilter
                  )
                }
              >

                📍 Filter by Location

                {locationFilter !== "All" && (
                  <span className="filter-selected-text">
                    : {locationFilter}
                  </span>
                )}

                <span className="filter-arrow">
                  {showLocationFilter
                    ? "▲"
                    : "▼"}
                </span>

              </button>


              {showLocationFilter && (

                <div className="category-filter-menu location-filter-menu">

                  <button
                    className={
                      locationFilter === "All"
                        ? "category-option selected-option"
                        : "category-option"
                    }
                    onClick={() => {

                      setLocationFilter("All");

                      setShowLocationFilter(
                        false
                      );

                    }}
                  >
                    All Locations
                  </button>


                  {locations.map(
                    (location) => (

                      <button
                        key={location}
                        className={
                          locationFilter ===
                          location
                            ? "category-option selected-option"
                            : "category-option"
                        }
                        onClick={() => {

                          setLocationFilter(
                            location
                          );

                          setShowLocationFilter(
                            false
                          );

                        }}
                      >
                        {location}
                      </button>

                    )
                  )}

                </div>

              )}

            </div>


            {/* ==========================================
                SORT
            ========================================== */}

            <select
              className="sort-select"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            >

              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>

            </select>


            {/* ==========================================
                CLEAR
            ========================================== */}

            {(typeFilter !== "All" ||
              categoryFilter !== "All" ||
              locationFilter !== "All" ||
              searchText !== "") && (

              <button
                className="clear-filter-btn"
                onClick={clearFilters}
              >
                Clear
              </button>

            )}

          </div>

        </div>


        {/* ==========================================
            RESULTS COUNT
        ========================================== */}

        {!loading && (

          <div className="results-count">

            {filteredItems.length}{" "}

            {filteredItems.length === 1
              ? "item"
              : "items"}{" "}

            found

          </div>

        )}


        {/* ==========================================
            LOADING
        ========================================== */}

        {loading ? (

          <div className="empty-box">

            <div>
              🔄
            </div>

            <h3>
              Loading items...
            </h3>

            <p>
              Please wait while we load
              the latest reports.
            </p>

          </div>

        ) : filteredItems.length === 0 ? (

          /* ==========================================
             NO RESULTS
          ========================================== */

          <div className="empty-box">

            <div>
              📦
            </div>

            <h3>
              No items found
            </h3>

            <p>
              Try another search or filter.
            </p>

            <button
              className="clear-filter-btn"
              onClick={clearFilters}
            >
              Show All Items
            </button>

          </div>

        ) : (

          /* ==========================================
             ITEMS GRID
          ========================================== */

          <div className="items-grid">

            {filteredItems.map((item) => {

              const resolved =
                isResolved(item);


              return (

                <div
                  className={
                    resolved
                      ? "item-card resolved-card"
                      : "item-card"
                  }
                  key={item._id}
                >


                  {/* IMAGE */}

                  {item.image ? (

                    <img
                      src={`https://campus-find-peach.vercel.app${item.image}`}
                      alt={item.itemName}
                      className="item-image"
                    />

                  ) : (

                    <div className="no-image">
                      📦
                    </div>

                  )}


                  {/* CONTENT */}

                  <div className="item-content">


                    {/* Badges */}

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


                      {resolved && (
                        <span className="resolved-badge">
                          ✓ Resolved
                        </span>
                      )}

                    </div>


                    {/* Name */}

                    <h3>
                      {item.itemName}
                    </h3>


                    {/* Category */}

                    <p>
                      <strong>
                        Category:
                      </strong>{" "}
                      {item.category}
                    </p>


                    {/* Location */}

                    <p>
                      <strong>
                        Location:
                      </strong>{" "}
                      {item.location ||
                        "Not provided"}
                    </p>


                    {/* Date */}

                    <p>
                      <strong>
                        Date:
                      </strong>{" "}

                      {item.date
                        ? new Date(
                            item.date
                          ).toLocaleDateString()
                        : "Not available"}
                    </p>


                    {/* Description */}

                    <p>
                      {item.description}
                    </p>


                    {/* Resolved Message */}

                    {resolved && (
                      <div className="browse-resolved-message">
                        ✓ This item has been
                        successfully resolved.
                      </div>
                    )}


                    {/* View Details */}

                    <button
                      className="view-details-btn"
                      onClick={() =>
                        onViewDetails(item)
                      }
                    >
                      View Details →
                    </button>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>

    </div>
  );
}

export default BrowseItems;
