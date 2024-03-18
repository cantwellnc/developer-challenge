## Caduceus
![An image of Hermes with the caduceus.](hermes_with_caduceus.jpeg)

Caduceus is a system for reporting + querying medical malpratice information. It allows easy, transparent, and governable information exchange between health entities (medical boards, hospitals, individual practices, etc.), and allows peers to query the malpractice history of a given doctor across health entities in different states. It also provides an interface for doctors registering for medical licenses in new states, and the validity of their registration is determined by a smart contract on-chain. 

Usage:

Each input field on the page takes either a doctor name (in the case of `Fetch malpractice records by doctor name:`) or a json object representing an incident or registration. 

Fetch records example: `doc oc`

Incident example: 
```json
  {
      "id": 123456789012,
      "doctorName": "doc oc",
      "incidentDetails": "smashed some folks with his tentacles",
      "date": "3/17/24",
      "location": "Raleigh, NC",
      "causedLicenseRevocation": true
    }
```

Registration example: 
```json
  {
      "doctorName": "doc oc",
      "stateOfRegistration": "NC"
  }

```

I didn't get time to query the backend for "real" regisration and incident history when gathering the inputs for the registration smart contract, so there is some dummy data provided there that shows the differnent 
execution paths of the contract. 
