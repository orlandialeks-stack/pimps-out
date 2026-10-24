import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("PIMPS OUT runtime error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", background: "#09090B", color: "#fafafa", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24,
        fontFamily: "'Barlow Condensed', sans-serif", padding: 24, textAlign: "center" }}
        data-testid="error-boundary-fallback">
        <img src="/assets/logo-transparent.png" alt="PIMPS OUT" style={{ height: 56 }} />
        <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase" }}>
          Something glitched.
        </h1>
        <p style={{ color: "#a1a1aa", fontSize: 14, maxWidth: 420, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          The page hit an unexpected error. Our rule: we fix our own mistakes — reload and it should be gone.
        </p>
        <button onClick={() => window.location.reload()} data-testid="error-boundary-reload"
          style={{ background: "#E8272A", color: "#fff", padding: "14px 32px", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.15em", border: "none", cursor: "pointer" }}>
          RELOAD
        </button>
      </div>
    );
  }
}
