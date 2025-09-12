import { useEffect, useState } from "react";

function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(null);

  useEffect(() => {
    window.electronAPI.onProgressTotal((val) => {
      setTotal(Number(val)); // convert string to number    
    });
    window.electronAPI.onProgress((val) => {
      setProgress(Number(val)); // convert string to number
    });
  }, []);

  return (
    <div>
      {total === null ? (
        <h3>Loading...</h3>
      ) : (
        <div>
          <h3>Progress: {progress}/{total}</h3>
          <div style={{ width: "100%", background: "#ddd" }}>
            <div style={{ width: `${(progress/total)*100}%`, background: "#2A9D8F", height: "20px" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;