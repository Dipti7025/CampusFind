function Features() {
  return (
    <section className="features">

      <div className="section-heading">
        <p>HOW IT WORKS</p>
        <h2>Simple. Quick. Helpful.</h2>
      </div>

      <div className="feature-container">

        <div className="feature-card">
          <div className="feature-icon">
            📝
          </div>

          <h3>
            Report an Item
          </h3>

          <p>
            Tell us about something you lost or found on campus.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            🔎
          </div>

          <h3>
            Browse Items
          </h3>

          <p>
            Search through recently reported lost and found items.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            🤝
          </div>

          <h3>
            Reconnect
          </h3>

          <p>
            Help return lost belongings to their rightful owners.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Features;