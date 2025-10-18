// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {IDebazaarEscrow} from "./interfaces/IDebazaarEscrow.sol";
import {IDebazaarArbiter} from "./interfaces/IDebazaarArbiter.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title FunctionsConsumerDebazaarUpgradeable
 * @author 4rdii
 * @dev Upgradeable version of FunctionsConsumerDebazaar using UUPS proxy pattern
 */
contract FunctionsConsumerDebazaarUpgradeable is FunctionsClient, Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using FunctionsRequest for FunctionsRequest.Request;

    // Storage struct for upgradeable contract
    struct ConsumerStorage {
        bytes32 lastRequestId;
        bytes lastResponse;
        bytes lastError;
        address debazaarEscrow;
    }

    // Storage location constant
    bytes32 private constant CONSUMER_STORAGE = keccak256("FunctionsConsumerDebazaar.storage.v1");

    error UnexpectedRequestID(bytes32 requestId);
    error ZeroAddress();
    error NotEscrowContract();

    event ResponseReceived(bytes32 indexed requestId, bytes response, bytes err);

    constructor(address _router) FunctionsClient(_router) {
        // Disable initializers in implementation contract
        _disableInitializers();
    }

    /**
     * @notice Get the storage struct from the specific storage location
     * @return consumerStorage The ConsumerStorage struct
     */
    function _getStorage() internal pure returns (ConsumerStorage storage consumerStorage) {
        bytes32 position = CONSUMER_STORAGE;
        assembly {
            consumerStorage.slot := position
        }
    }

    /**
     * @notice Initialize the upgradeable contract
     * @param router Chainlink Functions router address
     * @param debazaarEscrow Escrow contract address
     * @param owner Owner address (can be different from escrow)
     */
    function initialize(address router, address debazaarEscrow, address owner) public initializer {
        if (router == address(0) || debazaarEscrow == address(0) || owner == address(0)) {
            revert ZeroAddress();
        }

        __Ownable_init(owner);
        __UUPSUpgradeable_init();

        // Initialize storage
        ConsumerStorage storage consumerStorage = _getStorage();
        consumerStorage.lastRequestId = bytes32(0);
        consumerStorage.debazaarEscrow = debazaarEscrow;
    }

    function setEscrowContract(address debazaarEscrow) external onlyOwner {
        ConsumerStorage storage consumerStorage = _getStorage();
        consumerStorage.debazaarEscrow = debazaarEscrow;
    }

    /**
     * @notice Send a simple request
     * @param source JavaScript source code
     * @param encryptedSecretsUrls Encrypted URLs where to fetch user secrets
     * @param donHostedSecretsSlotID Don hosted secrets slotId
     * @param donHostedSecretsVersion Don hosted secrets version
     * @param args List of arguments accessible from within the source code
     * @param bytesArgs Array of bytes arguments, represented as hex strings
     * @param subscriptionId Billing ID
     */
    function sendRequest(
        string memory source,
        bytes memory encryptedSecretsUrls,
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        string[] memory args,
        bytes[] memory bytesArgs,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 donID
    ) external returns (bytes32 requestId) {
        ConsumerStorage storage consumerStorage = _getStorage();
        if (msg.sender != consumerStorage.debazaarEscrow) {
            revert NotEscrowContract();
        }
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (encryptedSecretsUrls.length > 0) {
            req.addSecretsReference(encryptedSecretsUrls);
        } else if (donHostedSecretsVersion > 0) {
            req.addDONHostedSecrets(donHostedSecretsSlotID, donHostedSecretsVersion);
        }
        if (args.length > 0) req.setArgs(args);
        if (bytesArgs.length > 0) req.setBytesArgs(bytesArgs);

        consumerStorage.lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
        return consumerStorage.lastRequestId;
    }

    /**
     * @notice Send a pre-encoded CBOR request
     * @param request CBOR-encoded request data
     * @param subscriptionId Billing ID
     * @param gasLimit The maximum amount of gas the request can consume
     * @param donID ID of the job to be invoked
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR(bytes memory request, uint64 subscriptionId, uint32 gasLimit, bytes32 donID)
        external
        returns (bytes32 requestId)
    {
        ConsumerStorage storage consumerStorage = _getStorage();
        if (msg.sender != consumerStorage.debazaarEscrow) {
            revert NotEscrowContract();
        }
        consumerStorage.lastRequestId = _sendRequest(request, subscriptionId, gasLimit, donID);
        return consumerStorage.lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        ConsumerStorage storage consumerStorage = _getStorage();
        if (consumerStorage.lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        consumerStorage.lastResponse = response;
        consumerStorage.lastError = err;
        IDebazaarEscrow(consumerStorage.debazaarEscrow).fulfillRequest(requestId, response, err);
        emit ResponseReceived(requestId, consumerStorage.lastResponse, consumerStorage.lastError);
    }

    /**
     * @notice Get the current escrow contract address
     * @return The escrow contract address
     */
    function getEscrowContract() external view returns (address) {
        ConsumerStorage storage consumerStorage = _getStorage();
        return consumerStorage.debazaarEscrow;
    }

    /**
     * @notice Get the last request details
     * @return requestId The last request ID
     * @return response The last response
     * @return error The last error
     */
    function getLastRequestDetails()
        external
        view
        returns (bytes32 requestId, bytes memory response, bytes memory error)
    {
        ConsumerStorage storage consumerStorage = _getStorage();
        return (consumerStorage.lastRequestId, consumerStorage.lastResponse, consumerStorage.lastError);
    }

    /**
     * @notice Get the last request ID
     * @return The last request ID
     */
    function getLastRequestId() external view returns (bytes32) {
        ConsumerStorage storage consumerStorage = _getStorage();
        return consumerStorage.lastRequestId;
    }

    /**
     * @notice Get the last response
     * @return The last response
     */
    function getLastResponse() external view returns (bytes memory) {
        ConsumerStorage storage consumerStorage = _getStorage();
        return consumerStorage.lastResponse;
    }

    /**
     * @notice Get the last error
     * @return The last error
     */
    function getLastError() external view returns (bytes memory) {
        ConsumerStorage storage consumerStorage = _getStorage();
        return consumerStorage.lastError;
    }

    /**
     * @notice Authorize upgrade (required by UUPSUpgradeable)
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional checks can be added here if needed
        // For example, checking if the new implementation is valid
    }

    /**
     * @notice Get the current implementation version
     * @return version The current version string
     */
    function version() public pure returns (string memory) {
        return "1.0.0";
    }
}
