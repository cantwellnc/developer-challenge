import FireFly, { FireFlySubscriptionBase } from "@hyperledger/firefly-sdk";
import express from "express";
import bodyparser, { json } from "body-parser";
import doctorregistration from "../contracts/doctor_registration.json";
import { v4 as uuidv4 } from "uuid";

// TODOS:

// 1) experiment with uploading report data to a single peer, ex: hospital A. DONE
// 2) experiment with broadcasting data from that peer to others + seeing what gets recorded on the chain. DONE
// 3) experiment with querying broadcasted data (how can we actually get at the original malpractice incident?) DONE
// 4) experiment with deploying a smart contract for managing doctor registration. How can we:
// a) trigger the contract to run on doctor registration submission, ex: emit DoctorRegistrationSubmitted(doctor_name, doctor_uid, location)
// b) feed the contract the doctor's practice history (can be binary indicator, or a threshold determined by frequency of occurrences or something)
//  on the chain? Is this easy? DONE
// 5) Route to different nodes based on form values to represent single peers getting reports + then propagating to others

const PORT = 4001;
const HOSTS = [
  "http://localhost:5000",
  "http://localhost:5001",
  "http://localhost:5002",
];
const NAMESPACE = "default";
const app = express();
const fireflies = HOSTS.map(
  (host) => new FireFly({ host: host, namespace: NAMESPACE }),
);

let apiName: string;
app.use(bodyparser.json());

// Querying Incidents
app.get("/api/value", async (req, res) => {
  // TODO: break this out into some separate functions to make it more readable
  const doctorName = req.query.doctor;
  console.log(`Doctor: ${req.query.doctor}`);
  const resp = await Promise.all(
    fireflies.map(async (firefly) => firefly.getMessages()),
  );
  const broadcasts = resp
    .flat()
    .filter((item) => item.header.type === "broadcast");
  const results = [];
  for (const r of broadcasts) {
    for (const datum of r.data) {
      if (datum.id !== undefined) {
        // get data across all nodes, potentially producing duplicates
        const dataItems: any = await Promise.all(
          fireflies.map(async (firefly) => firefly.getData(datum.id!)),
        );
        console.log(dataItems);
        for (const item of dataItems) {
          if (typeof item.value == "string") {
            // we have found a message that is NOT a smart contract deployment, so accumulate.
            const content = JSON.parse(item.value);
            try {
              // it may not be valid JSON though, so let's parse if it possible.
              const validContent = JSON.parse(content);
              if (validContent.doctorName == doctorName) {
                results.push(content);
              }
            } catch (e: any) {
              console.error(
                `Ignoring ${content} , since it is not valid JSON.`,
              );
            }
          }
        }
      }
    }
  }
  res.send(results);
});

// Reporting Incidents
app.post("/api/value", async (req, res) => {
  try {
    // upload the data to ex: node 1
    const fireflyRes = await fireflies[0].uploadData({
      value: JSON.stringify(req.body.incident),
    });

    // broadcast to peers
    fireflies[0].sendBroadcast({
      data: [
        {
          id: fireflyRes.id,
        },
      ],
    });

    res.status(202).send({
      id: fireflyRes.id,
    });
  } catch (e: any) {
    res.status(500).send({
      error: e.message,
    });
  }
});

// Registrations
app.post("/api/register", async (req, res) => {
  // just run on one node for now, but a TODO would be to route to a different node depending on
  // location or something like that
  try {
    const fireflyRes = await fireflies[0].queryContractAPI(
      apiName,
      "validate",
      {
        // Hardcoded input for now, just to see if we can actually call contract
        input: {
          currentRegistration: req.body.currentRegistration,
          // TODO: replace incidentHistory and registrationHistory with api calls
          incidentHistory:
            req.body.currentRegistration.doctorName === "doc oc"
              ? [
                  {
                    id: 123456789012,
                    doctorName: "doc oc",
                    incidentDetails: "bashed em with tentacle",
                    date: "2/7/24",
                    location: "Raleigh, NC",
                    causedLicenseRevocation: true,
                  },
                ]
              : [],
          registrationHistory:
            req.body.currentRegistration.doctorName === "doc oc"
              ? [
                  { doctorName: "doc oc", stateOfRegistration: "OK" },
                  { doctorName: "doc oc", stateOfRegistration: "NC" },
                ]
              : [
                  {
                    doctorName: req.body.currentRegistration.doctorName,
                    stateOfRegistration: "NC",
                  },
                ],
        },
      },
    );
    res.status(202).send({
      id: fireflyRes.id,
      output: fireflyRes.output,
    });
  } catch (e: any) {
    res.status(500).send({
      error: e.message,
    });
  }
});

async function init() {
  // Deploy registration contract to all nodes
  fireflies.map(async (firefly) => {
    const deployRes = await firefly.deployContract(
      {
        definition:
          doctorregistration.contracts[
            "doctor_registration.sol:DoctorRegistration"
          ].abi,
        contract:
          doctorregistration.contracts[
            "doctor_registration.sol:DoctorRegistration"
          ].bin,
        // input: ["0"],
      },
      { confirm: true },
    );
    const contractAddress = deployRes.output.contractLocation.address;

    const generatedFFI = await firefly.generateContractInterface({
      name: uuidv4(),
      namespace: NAMESPACE,
      version: "1.0",
      description: "Successfully deployed doctor registration contract.",
      input: {
        abi: doctorregistration.contracts[
          "doctor_registration.sol:DoctorRegistration"
        ].abi,
      },
    });

    const contractInterface = await firefly.createContractInterface(
      generatedFFI,
      { confirm: true },
    );

    const contractAPI = await firefly.createContractAPI(
      {
        interface: {
          id: contractInterface.id,
        },
        location: {
          address: contractAddress,
        },
        name: uuidv4(),
      },
      { confirm: true },
    );

    apiName = contractAPI.name;

    const submittedListener = await firefly.createContractAPIListener(
      apiName,
      "DoctorRegistrationSubmitted",
      {
        topic: "submitted",
      },
    );

    const acceptedListener = await firefly.createContractAPIListener(
      apiName,
      "DoctorRegistrationAccepted",
      {
        topic: "accepted",
      },
    );

    const rejectedListener = await firefly.createContractAPIListener(
      apiName,
      "DoctorRegistrationRejected",
      {
        topic: "rejected",
      },
    );

    firefly.listen(
      {
        filter: {
          events: "blockchain_event_received",
        },
      },
      async (socket, event) => {
        console.log(event.blockchainEvent?.output);
      },
    );
  });

  // Listen for blockchain events on all nodes, logging out events as they happen

  // Start listening
  app.listen(PORT, () =>
    console.log(`Kaleido DApp backend listening on port ${PORT}!`),
  );
}

init().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});

module.exports = {
  app,
};
