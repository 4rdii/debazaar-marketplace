import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Deploys simple mocks for ERC20 and ERC721 on Arbitrum Sepolia
const ArbitrumSepoliaMockDeployments = buildModule("ArbitrumSepoliaMockDeploymentsV1", (m) => {
  // Parameters (customizable via --parameters.NAME value)
  const erc20Name = m.getParameter("erc20Name", process.env.MOCK_ERC20_NAME || "MockToken");
  const erc20Symbol = m.getParameter("erc20Symbol", process.env.MOCK_ERC20_SYMBOL || "MTK");

  const erc721Name = m.getParameter("erc721Name", process.env.MOCK_ERC721_NAME || "MockNFT");
  const erc721Symbol = m.getParameter("erc721Symbol", process.env.MOCK_ERC721_SYMBOL || "MNFT");

  // Deploy mocks
  const mockERC20 = m.contract("MockERC20", [erc20Name, erc20Symbol]);
  const mockERC721 = m.contract("MockERC721", [erc721Name, erc721Symbol]);

  return {
    mockERC20,
    mockERC721,
  };
});

export default ArbitrumSepoliaMockDeployments;


