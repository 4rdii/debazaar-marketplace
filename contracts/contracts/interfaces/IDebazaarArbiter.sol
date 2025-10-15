// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDebazaarArbiter {
    function addListingToQueue(bytes32 _listingId) external payable;
    function getEntropyV2() external view returns (address);
}