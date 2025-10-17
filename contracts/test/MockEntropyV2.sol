// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IEntropyV2} from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import {IEntropyConsumer} from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

contract MockEntropyV2 {
    uint128 public constant FEE = 0.001 ether;
    uint64 private s_sequenceNumber;
    
    mapping(uint64 => address) private s_consumers;
    mapping(uint64 => bytes32) private s_randomNumbers;
    
    function requestV2() external payable returns (uint64) {
        require(msg.value >= FEE, "Insufficient fee");
        s_sequenceNumber++;
        s_consumers[s_sequenceNumber] = msg.sender;
        return s_sequenceNumber;
    }
    
    function getFeeV2() external pure returns (uint128) {
        return FEE;
    }
    
    function getEntropy() external view returns (address) {
        return address(this);
    }
    
    // Test helper function to simulate entropy callback
    function simulateCallback(uint64 sequenceNumber, bytes32 randomNumber) external {
        address consumer = s_consumers[sequenceNumber];
        require(consumer != address(0), "Invalid sequence number");
        
        s_randomNumbers[sequenceNumber] = randomNumber;
        
        // Call the consumer's entropyCallback function
        // (bool success,) = consumer.call(
        //     abi.encodeWithSignature(
        //         "_entropyCallback(uint64,address,bytes32)",
        //         sequenceNumber,
        //         address(this),
        //         randomNumber
        //     )
        // );

        // require(success, "Callback failed");
        IEntropyConsumer(consumer)._entropyCallback(sequenceNumber, address(this), randomNumber);
    }
    
    // Test helper to get stored random number
    function getRandomNumber(uint64 sequenceNumber) external view returns (bytes32) {
        return s_randomNumbers[sequenceNumber];
    }
}

