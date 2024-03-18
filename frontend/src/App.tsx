import { FormEvent, useState } from "react";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [queryResponse, setQueryResponse] = useState("");

  // Doctor name
  const [doctorName, setDoctorName] = useState("");
  // Incident report 
  const [incidentReport, setIncidentReport] = useState("");

  // Doctor registration input
  const [registrationInput, setRegistrationInput] = useState("");
  // Doctor registration status after an attempted registration
  const [registrationStatus, setRegistrationStatus] = useState("");


 
  async function addNewIncident() {
    // Example Incident 
    // {
    //   "id": 123456789012,
    //   "doctorName": "doc oc",
    //   "incidentDetails": "smashed some folks with he tentacles",
    //   "date": "3/17/24",
    //   "location": "Raleigh, NC",
    //   "causedLicenseRevocation": true
    // }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/value`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident: incidentReport,
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



  async function getIncidents() {
    // Example query  
    // "doc oc",
    setLoading(true);
    setErrorMsg(null);
    try {
      // Add query params, pointing to value rn but this will change.
      const res = await fetch(`/api/value?` + new URLSearchParams({
        doctor: doctorName,
      }));
      const resJSON = await res.json()
      const incidents = new Set(resJSON.map((item: any) => JSON.stringify(JSON.parse(item))));
      console.log(`INCIDENTS: ${incidents}`)
      if (!res.ok) {
        setErrorMsg(resJSON.error);
      } else {
        setQueryResponse(JSON.stringify([...incidents].map((item) => JSON.parse(item))));
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }

  async function invokeContract() {
    // Example Registration
    // {
    //   "doctorName": "doc oc", 
    //   "stateOfRegistration": "NC"
    // }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({currentRegistration: JSON.parse(registrationInput)}),
      });
      const resJSON = await res.json()
      if (!res.ok) {
        setErrorMsg(resJSON.error);
      }
      else {
        console.log(`RESPONSE: ${JSON.stringify(resJSON)}`)
        setRegistrationStatus(JSON.stringify(resJSON))
      }
    } catch (err: any) {
      setErrorMsg(err.stack);
    }
    setLoading(false);
  }

  function handleIncidentReportInput(event: FormEvent<HTMLInputElement>) {
    setIncidentReport(event.currentTarget.value);
  }

  function handleDoctorNameInput(event: FormEvent<HTMLInputElement>) {
    setDoctorName(event.currentTarget.value);
  }

  function handleDoctorRegistrationInput(event: FormEvent<HTMLInputElement>) {
    setRegistrationInput(event.currentTarget.value);
  }

  // TODO: 
  // 1) create separate change handlers for each input field. DONE
  // 2) create separate set/get api invocations for each "section": Incident report, patient query, doctor registration DONE
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
            onClick={addNewIncident}
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
            onClick={getIncidents}
          >
            Submit
          </button>
          {queryResponse !== "" ? <p> {queryResponse}</p> : <p>&nbsp;</p>}
        </p>

        {/* Doctor registration (for ex: medical board licensure in new state) */}
        <p>
          <span>Doctor Registration: </span>
          <input className="doctor-registration" onChange={handleDoctorRegistrationInput}/>
          <button
            type="button"
            className="App-button"
            onClick={invokeContract}
          >
            Submit
          </button>
          {registrationStatus !== "" ? <p> {registrationStatus}</p> : <p>&nbsp;</p>}
        </p>

        {/* Error message display */}
        {errorMsg && <pre className="App-error">Error: {errorMsg}</pre>}
      </header>
    </div>
  );
}

export default App;
