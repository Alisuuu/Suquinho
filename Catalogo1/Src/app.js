function App() {
  return (
    <div className="dark-mode">
      <MovieCatalog />
    </div>
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);