import FireFly, { FireFlySubscriptionBase } from "@hyperledger/firefly-sdk";
import express from "express";
import bodyparser, { json } from "body-parser";
import simplestorage from "../contracts/simple_storage.json";
import { v4 as uuidv4 } from "uuid";

// TODOS:

// 1) experiment with uploading report data to a single peer, ex: hospital A. DONE
// 2) experiment with broadcasting data from that peer to others + seeing what gets recorded on the chain. DONE
// 3) experiment with querying broadcasted data (how can we actually get at the original malpractice incident?) DONE
// 4) experiment with deploying a smart contract for managing doctor registration. How can we:
// a) trigger the contract to run on doctor registration submission, ex: emit DoctorRegistrationSubmitted(doctor_name, doctor_uid, location)
// b) feed the contract the doctor's practice history (can be binary indicator, or a threshold determined by frequency of occurrences or something)
//  on the chain? Is this easy?

const PORT = 4001;
// this puts all the stuff we want onto a single firefly supernode
const HOSTS = [
  "http://localhost:5000",
  "http://localhost:5001",
  "http://localhost:5002",
];
// it was set to 5000 (ip of first node), so that's why we only saw certain events (ex: txns) there.
const NAMESPACE = "default";
const app = express();
const fireflies = HOSTS.map(
  (host) => new FireFly({ host: host, namespace: NAMESPACE }),
);

let apiName: string;
app.use(bodyparser.json());

app.get("/api/value", async (req, res) => {
  // TODO: break this out into some separate functions.
  const doctor_name = req.query.doctor
  console.log(`Doctor: ${req.query.doctor}`)
  const resp = await fireflies[0].getMessages()
  const broadcasts = resp.filter((item) => item.header.type === "broadcast")
  const results = []
  for (const r of broadcasts) {
    for (const datum of r.data){
      if (datum.id !== undefined) {
        const item: any = await fireflies[0].getData(datum.id)
        if (typeof item.value == "string") {
          // we have found a message that is NOT a smart contract deployment, so accumulate. 
          const content = JSON.parse(item.value)
          try {
            // it may not be valid JSON though, so let's parse if it possible.
            const validContent = JSON.parse(content)
            if (validContent.doctor == doctor_name) {
              results.push(content)
            }
          }
          catch (e: any) {
            console.error(`Ignoring ${content} , since it is not valid JSON.`)
          }
        }
      }
    }
  }
  res.send(results)
});

app.post("/api/value", async (req, res) => {
  try {
    // upload the data to ex: node 1
    const fireflyRes = await fireflies[0].uploadData({
      value: JSON.stringify(req.body.x),
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

async function init() {
  // const deployRes = await fireflies[0].deployContract(
  //   {
  //     definition:
  //       simplestorage.contracts["simple_storage.sol:SimpleStorage"].abi,
  //     contract: simplestorage.contracts["simple_storage.sol:SimpleStorage"].bin,
  //     input: ["0"],
  //   },
  //   { confirm: true },
  // );
  // const contractAddress = deployRes.output.contractLocation.address;

  // const generatedFFI = await fireflies[0].generateContractInterface({
  //   name: uuidv4(),
  //   namespace: NAMESPACE,
  //   version: "1.0",
  //   description: "Auto-deployed simple-storage contract",
  //   input: {
  //     abi: simplestorage.contracts["simple_storage.sol:SimpleStorage"].abi,
  //   },
  // });

  // const contractInterface = await fireflies[0].createContractInterface(
  //   generatedFFI,
  //   { confirm: true },
  // );

  // const contractAPI = await fireflies[0].createContractAPI(
  //   {
  //     interface: {
  //       id: contractInterface.id,
  //     },
  //     location: {
  //       address: contractAddress,
  //     },
  //     name: uuidv4(),
  //   },
  //   { confirm: true },
  // );

  // apiName = contractAPI.name;

  // const listener = await fireflies[0].createContractAPIListener(apiName, "Changed", {
  //   topic: "changed",
  // });

  // Listen for blockchain events on all nodes, logging out events as they happen
  fireflies.map((firefly) =>
    firefly.listen(
      {
        filter: {
          events: "blockchain_event_received",
        },
      },
      async (socket, event) => {
        console.log(event.blockchainEvent?.output);
      },
    ),
  );

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
