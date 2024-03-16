import { FormEvent, useState } from "react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [desiredValue, setDesiredValue] = useState("test");
  const [value, setValue] = useState("");

  async function setContractValue() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/value`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x: desiredValue,
        }),
      });
      const { error } = await res.json();
      if (!res.ok) {
        setErrorMsg(error);
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }

  async function getContractValue() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/value`);
      // unpacking is tricky. the below line had me confused for a minute. 
      // accessing nonexistent property on an object is just undefined; it doesn't throw an error
      const resJSON = await res.json();
      console.log(resJSON)
      if (!res.ok) {
        setErrorMsg(resJSON.error);
      } else {
        setValue(JSON.stringify(resJSON));
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }

  function handleChange(event: FormEvent<HTMLInputElement>) {
    setDesiredValue(event.currentTarget.value);
  }



  // TODO: 
  // 1) create separate change handlers for each input field
  // 2) create separate set/get api invocations for each "section": Incident report, patient query, doctor registration
  // 3) beautify the input + output for each section (least important). Focus on functionality.
  return (
    <div className="App">
      <header className="App-header">
        {/* Report an Incident */}
        <p>
          <input className="incident-input" onChange={handleChange} />
          <button
            type="button"
            className="App-button"
            onClick={setContractValue}
          >
            Set Value
          </button>
        </p>
        <p>
          <button
            type="button"
            className="App-button"
            onClick={getContractValue}
          >
            Get Value
          </button>
          {value !== "" ? <p>Retrieved value: {value}</p> : <p>&nbsp;</p>}
        </p>

        {/* Query malpractice incident history */}
        <p>
          <input className="incident-history" />
          <button
            type="button"
            className="App-button"
            onClick={setContractValue}
          >
            Set Value
          </button>
        </p>
        <p>
          <button
            type="button"
            className="App-button"
            onClick={getContractValue}
          >
            Get Value
          </button>
          {value !== "" ? <p>Retrieved value: {value}</p> : <p>&nbsp;</p>}
        </p>

        {/* Doctor registration (for medical board licensure in new state) */}
        <p>
          <input className="doctor-registration"/>
          <button
            type="button"
            className="App-button"
            onClick={setContractValue}
          >
            Set Value
          </button>
        </p>
        <p>
          <button
            type="button"
            className="App-button"
            onClick={getContractValue}
          >
            Get Value
          </button>
          {value !== "" ? <p>Retrieved value: {value}</p> : <p>&nbsp;</p>}
        </p>
        {errorMsg && <pre className="App-error">Error: {errorMsg}</pre>}
      </header>
    </div>
  );
}

export default App;
