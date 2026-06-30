import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      info: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error);
    console.error(info);

    this.setState({
      error,
      info,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: "#111",
            color: "#fff",
            padding: 20,
            direction: "rtl",
            minHeight: "100vh",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
          }}
        >
          <h2>حدث خطأ داخل التطبيق</h2>

          <h3>الرسالة:</h3>
          <pre>{String(this.state.error)}</pre>

          <h3>Stack:</h3>
          <pre>{this.state.error?.stack}</pre>

          <h3>Component Stack:</h3>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
