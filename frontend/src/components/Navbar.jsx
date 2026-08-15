function Navbar({
  onHome,
  onBrowse,
  onReport,
  onAdmin
}) {
  return (
    <nav className="navbar">

      {/* Logo */}
      <button
        className="logo"
        onClick={onHome}
      >
        🔎 Campus<span>Find</span>
      </button>


      {/* Navigation Buttons */}
      <div className="nav-links">

        <button
          className="nav-home"
          onClick={onHome}
        >
          Home
        </button>


        <button
          className="nav-browse"
          onClick={onBrowse}
        >
          Browse Items
        </button>


        <button
          className="nav-report"
          onClick={onReport}
        >
          Report Item
        </button>


        <button
          className="nav-admin"
          onClick={onAdmin}
        >
          Admin
        </button>

      </div>

    </nav>
  );
}

export default Navbar;
