import FireFly, { FireFlySubscriptionBase } from "@hyperledger/firefly-sdk";
import express from "express";
import bodyparser from "body-parser";
import simplestorage from "../contracts/simple_storage.json";
import { v4 as uuidv4 } from "uuid";

// TODOS: 

// 1) experiment with uploading report data to a single peer, ex: hospital A. 
// 2) experiment with broadcasting data from that peer to others + seeing what gets recorded on the chain.
// 3) experiment with querying broadcasted data (how can we actually get at the original malpractice incident?)
// 4) experiment with deploying a smart contract for managing doctor registration. How can we: 
  // a) trigger the contract to run on doctor registration submission, ex: emit DoctorRegistrationSubmitted(doctor_name, doctor_uid, location)
  // b) feed the contract the doctor's practice history (can be binary indicator, or a threshold determined by frequency of occurrences or something)
  //  on the chain? Is this easy?


















const PORT = 4001;
// this puts all the stuff we want onto a single firefly supernode
const HOST = "http://localhost:5001"; 
// it was set to 5000 (ip of first node), so that's why we only saw certain events (ex: txns) there. 
const NAMESPACE = "default";
const app = express();
const firefly = new FireFly({
  host: HOST,
  namespace: NAMESPACE,
});

let apiName: string;

app.use(bodyparser.json());

app.get("/api/value", async (req, res) => {
  res.send(await firefly.queryContractAPI(apiName, "get", {}));
});

app.post("/api/value", async (req, res) => {
  try {
    const fireflyRes = await firefly.invokeContractAPI(apiName, "set", {
      input: {
        x: req.body.x,
      },
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
  const deployRes = await firefly.deployContract(
    {
      definition:
        simplestorage.contracts["simple_storage.sol:SimpleStorage"].abi,
      contract: simplestorage.contracts["simple_storage.sol:SimpleStorage"].bin,
      input: ["0"],
    },
    { confirm: true }
  );
  const contractAddress = deployRes.output.contractLocation.address;

  const generatedFFI = await firefly.generateContractInterface({
    name: uuidv4(),
    namespace: NAMESPACE,
    version: "1.0",
    description: "Auto-deployed simple-storage contract",
    input: {
      abi: simplestorage.contracts["simple_storage.sol:SimpleStorage"].abi,
    },
  });

  const contractInterface = await firefly.createContractInterface(
    generatedFFI,
    { confirm: true }
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
    { confirm: true }
  );

  apiName = contractAPI.name;

  const listener = await firefly.createContractAPIListener(apiName, "Changed", {
    topic: "changed",
  });

  firefly.listen(
    {
      filter: {
        events: "blockchain_event_received",
      },
    },
    async (socket, event) => {
      console.log(event.blockchainEvent?.output);
    }
  );

  // Start listening
  app.listen(PORT, () =>
    console.log(`Kaleido DApp backend listening on port ${PORT}!`)
  );
}

init().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});

module.exports = {
  app,
};
