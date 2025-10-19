import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ArbitrumSepoliaDeploymentModule = buildModule("ArbitrumSepoliaDeploymentModuleV2", (m) => {
  // Arbitrum Sepolia specific parameters
  const owner = m.getParameter("owner", process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000");
  
  // Arbitrum Sepolia Chainlink Functions Router - using environment variable
  const functionsRouter = m.getParameter("functionsRouter", process.env.CHAINLINK_FUNCTIONS_ROUTER_ARB_SEPOLIA || "0x0000000000000000000000000000000000000000");
  
  // Arbitrum Sepolia Entropy V2 (Pyth) - placeholder address for now
  const entropyV2 = m.getParameter("entropyV2", "0x549ebba8036ab746611b4ffa1423eb0a4df61440");
  
  // Initial arbiters (should be set to actual arbiter addresses)
  const initialArbiters = m.getParameter("initialArbiters", [
    process.env.ARBITER_1 || "0x0000000000000000000000000000000000000001",
    process.env.ARBITER_2 || "0x0000000000000000000000000000000000000002",
    process.env.ARBITER_3 || "0x0000000000000000000000000000000000000003",
    process.env.ARBITER_4 || "0x0000000000000000000000000000000000000004",
    process.env.ARBITER_5 || "0x0000000000000000000000000000000000000005"
  ]);
  
  // Deploy DebazaarEscrow
  const debazaarEscrow = m.contract("DebazaarEscrow", [owner]);
  
  // Deploy DebazaarArbiter
  const debazaarArbiter = m.contract("DebazaarArbiter", [owner, initialArbiters, entropyV2]);
  
  // Deploy FunctionsConsumerUpgradable Logic Contract
  const functionsConsumerLogic = m.contract("FunctionsConsumerDebazaarUpgradeable", [functionsRouter]);
  
  // Deploy ERC1967Proxy for FunctionsConsumer
  const functionsConsumerProxy = m.contract("ERC1967Proxy", [
    functionsConsumerLogic,
    "0x" // Empty initialization data
  ]);
  
  // Create a reference to the proxy using FunctionsConsumer ABI
  const functionsConsumer = m.contractAt("FunctionsConsumerDebazaarUpgradeable", functionsConsumerProxy, {
    id: "FunctionsConsumerProxy"
  });
  
  // Set up contract relationships
  
  // Set arbiter in escrow
  m.call(debazaarEscrow, "setArbiter", [debazaarArbiter], {
    id: "setArbiterInEscrow"
  });
  
  // Set escrow in arbiter
  m.call(debazaarArbiter, "setDebazaarEscrow", [debazaarEscrow], {
    id: "setEscrowInArbiter"
  });
  
  // Set functions consumer in escrow
  m.call(debazaarEscrow, "setFunctionsConsumer", [functionsConsumerProxy], {
    id: "setFunctionsConsumerInEscrow"
  });
  
  // Initialize FunctionsConsumer through proxy
  m.call(functionsConsumer, "initialize", [functionsRouter, debazaarEscrow, owner], {
    id: "initializeFunctionsConsumer"
  });
  
  return { 
    debazaarEscrow,
    debazaarArbiter,
    functionsConsumerLogic,
    functionsConsumerProxy
  };
});

export default ArbitrumSepoliaDeploymentModule;
