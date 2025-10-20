import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Redeploy the escrow contract on Arbitrum Sepolia, then rewire to existing arbiter and functions proxy
const ArbitrumSepoliaUpdateEscrowDeployment = buildModule("ArbitrumSepoliaEscrowUpdateHardcodedV1", (m) => {
    const owner = m.getParameter("owner", process.env.DEPLOYER_ADDRESS || "0x0000000000000000000000000000000000000000");
    // Existing live contracts to rewire (hardcoded for now)
    const arbiterAddress = ""; // DebazaarArbiter
    const functionsProxyAddress = ""; // FunctionsConsumer Proxy
    // 1) Deploy fresh Escrow
    const debazaarEscrow = m.contract("DebazaarEscrow", [owner], { id: "NewDebazaarEscrow" });
    // 2) Attach to existing Arbiter and FunctionsConsumer proxy
    const arbiter = m.contractAt("DebazaarArbiter", arbiterAddress, { id: "ExistingArbiter" });
    const functionsConsumer = m.contractAt("FunctionsConsumerDebazaarUpgradeable", functionsProxyAddress, {
        id: "ExistingFunctionsConsumerProxy"
    });
      // 3) Rewire relationships
    m.call(debazaarEscrow, "setArbiter", [arbiter], { id: "Wire_escrow_setArbiter" });
    m.call(arbiter, "setDebazaarEscrow", [debazaarEscrow], { id: "Wire_arbiter_setEscrow" });
    m.call(debazaarEscrow, "setFunctionsConsumer", [functionsProxyAddress], { id: "Wire_escrow_setFunctionsConsumer" });

    // Optional: if your consumer exposes setter to update escrow reference
    m.call(functionsConsumer, "setEscrowContract", [debazaarEscrow], { id: "Wire_fc_setEscrowContract" });



    return {
        escrow: debazaarEscrow,
    };
});

export default ArbitrumSepoliaUpdateEscrowDeployment;