function Hero({
  onReportLost,
  onReportFound,
  onBrowse
}) {
  return (
    <section className="hero">

      <div className="hero-text">

        <p className="small-title">
          CAMPUS LOST & FOUND
        </p>

        <h1>
          Lost something?
          <br />
          <span>Let's help you find it.</span>
        </h1>

        <p className="hero-description">
          A simple platform for students to report lost
          items, share found items, and reconnect
          belongings with their owners.
        </p>

        <div className="hero-buttons">

          <button
            className="primary-btn"
            onClick={onReportLost}
          >
            Report Lost Item
          </button>

          <button
            className="secondary-btn"
            onClick={onReportFound}
          >
            Report Found Item
          </button>

        </div>

      </div>


      <div className="hero-card">

        <div className="search-icon">
          🔍
        </div>

        <h3>
          Find your lost item
        </h3>

        <p>
          Browse items reported by students
          around campus.
        </p>

        <button
          className="browse-btn"
          onClick={onBrowse}
        >
          Browse Lost & Found →
        </button>

      </div>

    </section>
  );
}

export default Hero;
