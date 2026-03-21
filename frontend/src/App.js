import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateNote from "./CreateNote";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateNote />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;