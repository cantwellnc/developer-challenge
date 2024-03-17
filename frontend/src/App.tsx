import { FormEvent, useState } from "react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [desiredValue, setDesiredValue] = useState("test");
  const [value, setValue] = useState("");

  // Doctor name
  const [doctorName, setDoctorName] = useState("");
  // Incident report 
  const [incidentReport, setIncidentReport] = useState("");

  async function addNewMalpraticeRecord() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/value`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x: incidentReport,
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

  async function getMalpracticeRecords() {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Add query params, pointing to value rn but this will change.
      const res = await fetch(`/api/value?` + new URLSearchParams({
        doctor: doctorName,
      }));
      const resJSON = await res.json()
      // console.log(`RAW: ${resJSON[0].doctor}`)
      const incidents = resJSON.map((item: any) => JSON.parse(item));
      console.log(`INCIDENTS: ${incidents}`)
      if (!res.ok) {
        setErrorMsg(resJSON.error);
      } else {
        setValue(JSON.stringify(incidents));
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }


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
      // Add query params, pointing to value rn but this will change.
      const res = await fetch(`/api/value?` + new URLSearchParams({
        doctor: 'andre',
      }));
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

  // function handleChange(event: FormEvent<HTMLInputElement>) {
  //   setDesiredValue(event.currentTarget.value);
  // }

  function handleIncidentReportInput(event: FormEvent<HTMLInputElement>) {
    setIncidentReport(event.currentTarget.value);
  }

  function handleDoctorNameInput(event: FormEvent<HTMLInputElement>) {
    setDoctorName(event.currentTarget.value);
  }

  // TODO: 
  // 1) create separate change handlers for each input field DONE
  // 2) create separate set/get api invocations for each "section": Incident report, patient query, doctor registration
  // 3) beautify the input + output for each section (least important). Focus on functionality.
  return (
    <div className="App">
      <header className="App-header">
        {/* Report an Incident */}
        <p>
          <span>Report a new incident: </span>
          <input className="incident-input" onChange={handleIncidentReportInput} />
          <button
            type="button"
            className="App-button"
            onClick={addNewMalpraticeRecord}
          >
            Submit
          </button>
        </p>

        {/* Query malpractice incident history */}
        <p>
          <span>Fetch malpractice records by doctor name: </span>
          <input onChange={handleDoctorNameInput}/>
          <button
            type="button"
            className="App-button"
            onClick={getMalpracticeRecords}
          >
            Submit
          </button>
          {value !== "" ? <p> {value}</p> : <p>&nbsp;</p>}
        </p>

        {/* Doctor registration (for ex: medical board licensure in new state) */}
        <p>
          <span>Doctor Registration: </span>
          <input className="doctor-registration"/>
          <button
            type="button"
            className="App-button"
            onClick={setContractValue}
          >
            Set Value
          </button>
        </p>

        {/* Error message display */}
        {errorMsg && <pre className="App-error">Error: {errorMsg}</pre>}
      </header>
    </div>
  );
}

export default App;
